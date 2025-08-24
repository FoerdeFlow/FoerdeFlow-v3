import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: z.string().uuid(),
	}).parseAsync(data))

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
