import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelRoles.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		travelRole: idSchema,
	}).parseAsync(data))

	const item = await database.query.travelRoles.findFirst({
		where: eq(travelRoles.id, params.travelRole),
		with: {
			organizationItem: true,
			budget: {
				with: {
					organizationItem: true,
				},
				columns: {
					organizationItem: false,
				},
			},
		},
		columns: {
			organizationItem: false,
			budget: false,
		},
	})

	if(!item) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Dienstreiserolle nicht gefunden',
			data: {
				travelRoleId: params.travelRole,
			},
		})
	}

	return item
})
