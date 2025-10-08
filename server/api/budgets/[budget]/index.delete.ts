import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('budgets.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		budget: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(budgets)
		.where(eq(budgets.id, params.budget))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Haushalt nicht gefunden',
			data: {
				budgetId: params.budget,
			},
		})
	}
})
