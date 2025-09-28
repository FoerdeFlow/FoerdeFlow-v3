import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('organizationItems.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationItem: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(organizationItems)
		.where(eq(organizationItems.id, params.organizationItem))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Organisationseinheit nicht gefunden',
			data: {
				organizationItemId: params.organizationItem,
			},
		})
	}
})
