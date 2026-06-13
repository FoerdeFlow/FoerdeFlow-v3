import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		budget: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const budget = await database.query.budgets.findFirst({
		where: eq(budgets.id, query.budget),
		columns: {
			organizationItem: true,
		},
	})

	await checkPermission('longtermContracts.read', { organizationItem: budget?.organizationItem })

	if(!budget) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Budget not found',
			data: {
				budgetId: query.budget,
			},
		})
	}

	const result = await database.query.longtermContracts.findMany({
		where: eq(longtermContracts.budget, query.budget),
		columns: {
			id: true,
			title: true,
			startDate: true,
			endDate: true,
		},
	})

	return result
})
