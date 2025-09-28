import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('organizationTypes.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationType: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(organizationTypes).omit({ id: true }).parseAsync(data))

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
