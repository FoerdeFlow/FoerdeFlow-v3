import { eq, inArray, sql } from 'drizzle-orm'

interface WrittenItem {
	id?: string | null
	ord: number
	title: string
	description?: string | null
	revenues?: number | null
	expenses?: number | null
}

/**
 * Writes the titles of a budget plan, replacing the ones it carries.
 *
 * Titles are matched by their id: a title that carries one is changed, one
 * without is added and one that no longer appears is dropped. That keeps the
 * references of expense authorizations and payment orders intact, which is also
 * why a title they still point at cannot be dropped at all.
 *
 * Both the direct way and an approved application go through here, so that the
 * two never treat the same data differently.
 *
 * @param tx - The transaction to write in
 * @param plan - The id of the plan whose titles are written
 * @param items - The titles the plan carries afterwards
 * @throws When a title that is written or dropped cannot be
 */
export async function writeBudgetPlanItems(
	tx: ReturnType<typeof useDatabase>,
	plan: string,
	items: readonly WrittenItem[],
) {
	const existing = await tx.query.budgetPlanItems.findMany({
		where: eq(budgetPlanItems.plan, plan),
		columns: {
			id: true,
			ord: true,
			title: true,
		},
	})

	const known = new Set(existing.map((item) => item.id))
	const missing = items.find((item) => item.id && !known.has(item.id))
	if(missing) {
		throw createError({
			statusCode: 409,
			message: `Der geänderte Haushaltstitel „${missing.title}“ existiert nicht mehr`,
			data: { budgetPlanItemId: missing.id },
		})
	}

	const dropped = await checkBudgetPlanItemsDroppable(tx, existing, items)
	if(dropped.length > 0) {
		await tx
			.delete(budgetPlanItems)
			.where(inArray(budgetPlanItems.id, dropped.map((item) => item.id)))
	}

	// The ordinals are unique within a plan, so the titles that stay are first
	// moved out of the way. Without that, giving a title the ordinal another one
	// is about to give up would run into the constraint. Every ordinal is shifted
	// above every ordinal that is used afterwards, so the shift itself can never
	// collide either.
	const offset = Math.max(
		0,
		...existing.map((item) => item.ord),
		...items.map((item) => item.ord),
	) + 1
	await tx
		.update(budgetPlanItems)
		.set({ ord: sql`${budgetPlanItems.ord} + ${offset}` })
		.where(eq(budgetPlanItems.plan, plan))

	for(const { id, ...item } of items) {
		const values = {
			...item,
			description: item.description ?? null,
			revenues: item.revenues ?? 0,
			expenses: item.expenses ?? 0,
		}

		if(id) {
			await tx.update(budgetPlanItems).set(values).where(eq(budgetPlanItems.id, id))
		} else {
			await tx.insert(budgetPlanItems).values({ ...values, plan })
		}
	}
}
