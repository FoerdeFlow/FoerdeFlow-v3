import { eq } from 'drizzle-orm'
import { existsSync } from 'node:fs'
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
			domain: true,
		},
		with: {
			membershipType: true,
			organizationItem: true,
			organizationType: true,
			person: {
				with: {
					course: true,
				},
				columns: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					callName: true,
					gender: true,
					pronouns: true,
				},
			},
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

	return {
		...roleOccupant,
		person: roleOccupant.person
			? {
				...roleOccupant.person,
				hasPhoto: existsSync(`./data/${roleOccupant.person.id}`),
			}
			: null,
	}
})
