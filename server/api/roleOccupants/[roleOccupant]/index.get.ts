import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('roleOccupants.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		roleOccupant: idSchema,
	}).parseAsync(data))

	const roleOccupant = await database.query.roleOccupants.findFirst({
		where: eq(roleOccupants.id, params.roleOccupant),
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

	if(!roleOccupant) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Rolleninhaber nicht gefunden',
			data: {
				roleOccupantId: params.roleOccupant,
			},
		})
	}

	return roleOccupant
})
