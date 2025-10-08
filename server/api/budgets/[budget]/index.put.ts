import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('budgets.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		budget: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(budgets).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(budgets)
		.set(body)
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
