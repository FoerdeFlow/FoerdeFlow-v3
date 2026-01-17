import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('councils.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		council: idSchema,
	}).parseAsync(data))

	const council = await database.query.councils.findFirst({
		where: eq(councils.id, params.council),
	})

	if(!council) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Fachschaft nicht gefunden',
			data: {
				councilId: params.council,
			},
		})
	}

	return council
})
