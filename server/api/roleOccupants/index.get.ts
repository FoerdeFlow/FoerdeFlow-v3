import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('roleOccupants.read')

	const database = useDatabase()

	const query = await getValidatedQuery(event, async (data) => await z.object({
		role: z.uuid(),
	}).parseAsync(data))

	const roleOccupants = await database.query.roleOccupants.findMany({
		where: (roleOccupants, { eq }) => eq(roleOccupants.role, query.role),
		columns: {
			id: true,
		},
		with: {
			membershipType: true,
			organizationItem: true,
			organizationType: true,
			person: true,
		},
	})

	return roleOccupants
})
