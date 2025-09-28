import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('organizationItemGroups.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationItemGroup: idSchema,
	}).parseAsync(data))

	const organizationItemGroup = await database.query.organizationItemGroups.findFirst({
		where: eq(organizationItemGroups.id, params.organizationItemGroup),
		with: {
			members: {
				with: {
					organizationItem: true,
					membershipType: true,
				},
				columns: {
					id: false,
					organizationItemGroup: false,
				},
			},
		},
		columns: {
			id: false,
			organizationItem: false,
		},
	})

	if(!organizationItemGroup) {
		throw createError({
			statusCode: 404,
			statusMessage: 'OE-Gruppe nicht gefunden',
			data: {
				organizationItemGroupId: params.organizationItemGroup,
			},
		})
	}

	return organizationItemGroup
})
