import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('budgets.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		budget: idSchema,
	}).parseAsync(data))

	const budget = await database.query.budgets.findFirst({
		where: eq(budgets.id, params.budget),
		with: {
			organizationItem: true,
		},
		columns: {
			organizationItem: false,
		},
	})

	if(!budget) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Haushalt nicht gefunden',
			data: {
				budgetId: params.budget,
			},
		})
	}

	return budget
})
