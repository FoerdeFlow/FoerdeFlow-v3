import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		budgetPlan: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const plan = await database.query.budgetPlans.findFirst({
		where: eq(budgetPlans.id, params.budgetPlan),
		with: {
			budget: true,
			items: {
				columns: {
					plan: false,
				},
			},
		},
		columns: {
			id: false,
			budget: false,
		},
	})

	await checkPermission('budgetPlans.read', { organizationItem: plan?.budget.organizationItem })

	if(!plan) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Haushaltsplan nicht gefunden',
			data: {
				budgetPlanId: params.budgetPlan,
			},
		})
	}

	return plan
})
