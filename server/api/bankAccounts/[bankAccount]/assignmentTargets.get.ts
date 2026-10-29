import { asc, eq, inArray, or } from 'drizzle-orm'
import { z } from 'zod'

// Offers what a payment of the account may be assigned to. Kept apart from the
// budget routes, so that assigning payments does not need the permission to
// read the budget plans as well.
export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		bankAccount: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const organizationItem = await getBankAccountScope(database, params.bankAccount)

	await checkPermission('bankTransactions.update', { organizationItem })

	const budgetList = await database.query.budgets.findMany({
		where: eq(budgets.organizationItem, organizationItem),
		columns: {
			id: true,
			code: true,
			name: true,
		},
		with: {
			plans: {
				columns: {
					id: true,
					startDate: true,
					endDate: true,
				},
				with: {
					items: {
						columns: {
							id: true,
							ord: true,
							title: true,
							revenues: true,
							expenses: true,
						},
						orderBy: [ asc(budgetPlanItems.ord) ],
					},
				},
				orderBy: [ asc(budgetPlans.startDate) ],
			},
		},
		orderBy: [ asc(budgets.code) ],
	})

	const budgetIds = budgetList.map((budget) => budget.id)
	const itemIds = budgetList.flatMap((budget) =>
		budget.plans.flatMap((plan) => plan.items.map((item) => item.id)))

	const orders = budgetIds.length === 0
		? []
		: await database.query.paymentOrders.findMany({
			where: or(
				inArray(paymentOrders.budget, budgetIds),
				itemIds.length > 0 ? inArray(paymentOrders.budgetPlanItem, itemIds) : undefined,
			),
			columns: {
				id: true,
				type: true,
				budgetPlanItem: true,
				budget: true,
				title: true,
				amount: true,
			},
		})

	return {
		budgets: budgetList,
		paymentOrders: orders,
	}
})
