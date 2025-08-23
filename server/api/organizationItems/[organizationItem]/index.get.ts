import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationItem: idSchema,
	}).parseAsync(data))

	const organizationItem = await database.query.organizationItems.findFirst({
		where: eq(organizationItems.id, params.organizationItem),
		with: {
			parent: {
				columns: {
					id: true,
					code: true,
					name: true,
				},
				with: {
					organizationType: true,
				},
			},
			children: {
				columns: {
					id: true,
					code: true,
					name: true,
				},
				with: {
					organizationType: true,
				},
			},
			organizationType: true,
		},
	})

	if(!organizationItem) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Organisationseinheit nicht gefunden',
			data: {
				organizationItemId: params.organizationItem,
			},
		})
	}

	return organizationItem
})
