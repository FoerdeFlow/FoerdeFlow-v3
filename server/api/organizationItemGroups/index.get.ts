import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: z.uuid(),
	}).parseAsync(data))

	await checkPermission('organizationItemGroups.read', { organizationItem: query.organizationItem })

	const database = useDatabase()

	return await database.query.organizationItemGroups.findMany({
		where: eq(organizationItemGroups.organizationItem, query.organizationItem),
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
			organizationItem: false,
		},
	})
})
