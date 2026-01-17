import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('candidates.update')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		candidate: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(candidates).omit({ id: true }).parseAsync(data))

	const database = useDatabase()

	const result = await database
		.update(candidates)
		.set(body)
		.where(eq(candidates.id, params.candidate))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kandidat*in nicht gefunden',
			data: {
				candidateId: params.candidate,
			},
		})
	}
})
