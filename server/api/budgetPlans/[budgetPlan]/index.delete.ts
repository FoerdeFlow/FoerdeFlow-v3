import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		budgetPlan: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const budgetPlan = await database.query.budgetPlans.findFirst({
		where: eq(budgetPlans.id, params.budgetPlan),
		with: {
			budget: {
				columns: {
					organizationItem: true,
				},
			},
		},
		columns: {},
	})

	await checkPermission('budgetPlans.delete', { organizationItem: budgetPlan?.budget.organizationItem })

	const result = await database
		.delete(budgetPlans)
		.where(eq(budgetPlans.id, params.budgetPlan))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Haushaltsplan nicht gefunden',
			data: {
				budgetPlanId: params.budgetPlan,
			},
		})
	}
})
