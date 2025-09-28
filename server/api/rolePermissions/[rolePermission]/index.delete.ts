import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('rolePermissions.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		rolePermission: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(rolePermissions)
		.where(eq(rolePermissions.id, params.rolePermission))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Rollenberechtigung nicht gefunden',
			data: {
				rolePermissionId: params.rolePermission,
			},
		})
	}
})
