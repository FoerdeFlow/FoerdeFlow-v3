import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationType: idSchema,
	}).parseAsync(data))

	const organizationType = await database.query.organizationTypes.findFirst({
		where: eq(organizationTypes.id, params.organizationType),
	})

	if(!organizationType) {
		throw createError({
			statusCode: 404,
			statusMessage: 'OE-Kategorie nicht gefunden',
			data: {
				organizationTypeId: params.organizationType,
			},
		})
	}

	return organizationType
})
