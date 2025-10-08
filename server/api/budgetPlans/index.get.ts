import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		budget: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	const budget = await database.query.budgets.findFirst({
		where: eq(budgets.id, query.budget),
		columns: {
			organizationItem: true,
		},
	})

	await checkPermission('budgetPlans.read', { organizationItem: budget?.organizationItem })

	if(!budget) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Budget not found',
			data: {
				budgetId: query.budget,
			},
		})
	}

	const plans = await database.query.budgetPlans.findMany({
		where: eq(budgetPlans.budget, query.budget),
		columns: {
			budget: false,
		},
	})

	return plans
})
