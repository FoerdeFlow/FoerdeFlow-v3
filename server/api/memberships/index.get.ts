import z from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const query = await getValidatedQuery(event, z.object({
		organizationItem: z.string().uuid(),
	}).parseAsync)

	const memberships = await database.query.memberships.findMany({
		where: (memberships, { eq }) => eq(memberships.organizationItem, query.organizationItem),
		with: {
			membershipType: true,
			endReason: true,
			memberPerson: true,
			memberOrganizationItem: true,
		},
		columns: {
			organizationItem: false,
		},
	})

	return memberships
})