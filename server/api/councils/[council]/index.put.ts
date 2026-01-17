import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('councils.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		council: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(councils).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(councils)
		.set(body)
		.where(eq(councils.id, params.council))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Fachschaft nicht gefunden',
			data: {
				councilId: params.council,
			},
		})
	}
})
