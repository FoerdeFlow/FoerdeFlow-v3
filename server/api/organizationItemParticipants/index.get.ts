import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const query = await getValidatedQuery(event, z.object({
		organizationItem: z.string().uuid(),
	}).parseAsync)

	const organizationItemParticipants = await database.query.organizationItemParticipants.findMany({
		where: (organizationItemParticipants, { eq }) => eq(organizationItemParticipants.organizationItem, query.organizationItem),
		with: {
			participantOrganizationItem: true,
			participantMembershipType: true,
		},
		columns: {
			organizationItem: false,
		},
	})

	return organizationItemParticipants
})