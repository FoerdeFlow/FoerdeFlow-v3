import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, z.object({
		organizationType: idSchema,
	}).parseAsync)

	const body = await readValidatedBody(event, createUpdateSchema(organizationTypes).omit({ id: true }).parseAsync)

	const result = await database
		.update(organizationTypes)
		.set(body)
		.where(eq(organizationTypes.id, params.organizationType))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'OE-Kategorie nicht gefunden',
			data: {
				organizationTypeId: params.organizationType,
			},
		})
	}
})
