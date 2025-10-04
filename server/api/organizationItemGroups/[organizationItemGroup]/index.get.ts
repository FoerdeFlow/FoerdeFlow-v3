import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationItemGroup: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

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
					organizationItem: false,
					membershipType: false,
				},
			},
		},
		columns: {
			id: false,
		},
	})

	await checkPermission('organizationItemGroups.read', {
		organizationItem: organizationItemGroup?.organizationItem,
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
