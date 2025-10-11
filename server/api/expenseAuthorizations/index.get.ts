import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		budgetPlan: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	const budgetPlan = await database.query.budgetPlans.findFirst({
		where: eq(budgetPlans.id, query.budgetPlan),
		with: {
			budget: {
				columns: {
					organizationItem: true,
				},
			},
		},
		columns: {},
	})

	await checkPermission('expenseAuthorizations.read', { organizationItem: budgetPlan?.budget.organizationItem })

	if(!budgetPlan) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Budget plan not found',
			data: {
				budgetPlanId: query.budgetPlan,
			},
		})
	}

	const result = await database.query.expenseAuthorizations.findMany({
		where: inArray(
			expenseAuthorizations.budgetPlanItem,
			database
				.select({ id: budgetPlanItems.id })
				.from(budgetPlanItems)
				.where(eq(budgetPlanItems.plan, query.budgetPlan)),
		),
		with: {
			budgetPlanItem: true,
		},
		columns: {
			budgetPlanItem: false,
		},
	})

	return result
})
