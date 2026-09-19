import { inArray } from 'drizzle-orm'

interface ExistingItem {
	id: string
	ord: number
	title: string
}

interface AppliedItem {
	id?: string | null
}

/**
 * Ensures that every title a change drops can be dropped at all.
 *
 * Expense authorizations and payment orders point at the title they are paid
 * from, and those references have no cascade: dropping such a title would fail
 * on the foreign key alone, which says nothing about what has to happen now.
 * They are therefore looked up beforehand, so that the applicant is told which
 * title is still in use.
 *
 * @param tx - The transaction to read in
 * @param existing - The titles the plan carries at the moment
 * @param applied - The titles the change applies for
 * @returns The titles that are dropped, all of them free of references
 * @throws When a title that is dropped is still paid from
 */
export async function checkBudgetPlanItemsDroppable(
	tx: ReturnType<typeof useDatabase>,
	existing: readonly ExistingItem[],
	applied: readonly AppliedItem[],
) {
	const kept = new Set(applied.flatMap((item) => item.id ? [ item.id ] : []))
	const dropped = existing.filter((item) => !kept.has(item.id))
	if(dropped.length === 0) return dropped

	const droppedIds = dropped.map((item) => item.id)
	const [ authorizations, orders ] = await Promise.all([
		tx.query.expenseAuthorizations.findMany({
			where: inArray(expenseAuthorizations.budgetPlanItem, droppedIds),
			columns: {
				id: true,
				budgetPlanItem: true,
			},
		}),
		tx.query.paymentOrders.findMany({
			where: inArray(paymentOrders.budgetPlanItem, droppedIds),
			columns: {
				id: true,
				budgetPlanItem: true,
			},
		}),
	])

	const blocked = new Set([ ...authorizations, ...orders ]
		.flatMap((item) => item.budgetPlanItem ? [ item.budgetPlanItem ] : []))
	if(blocked.size === 0) return dropped

	const titles = dropped
		.filter((item) => blocked.has(item.id))
		.map((item) => `„${item.title}“`)
		.join(', ')

	throw createError({
		statusCode: 409,
		message: `Der Haushaltstitel ${titles} kann nicht gestrichen werden, weil er noch von ` +
			'einer Ausgabeermächtigung oder einer Zahlungsanweisung verwendet wird',
		data: {
			budgetPlanItemIds: [ ...blocked ],
			expenseAuthorizationIds: authorizations.map((item) => item.id),
			paymentOrderIds: orders.map((item) => item.id),
		},
	})
}
