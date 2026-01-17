import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('elections.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		election: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(elections).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(elections)
		.set(body)
		.where(eq(elections.id, params.election))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Wahl nicht gefunden',
			data: {
				electionId: params.election,
			},
		})
	}
})
