import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelRoles.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelRole: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(travelRoles)
		.where(eq(travelRoles.id, params.travelRole))
		.catch((error: unknown) => {
			if(isForeignKeyViolation(error)) {
				throw createError({
					statusCode: 409,
					statusMessage: 'Der Eintrag wird noch verwendet und kann nicht gelöscht werden',
					data: {
						travelRoleId: params.travelRole,
					},
				})
			}
			throw error
		})

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Dienstreiserolle nicht gefunden',
			data: {
				travelRoleId: params.travelRole,
			},
		})
	}
})
