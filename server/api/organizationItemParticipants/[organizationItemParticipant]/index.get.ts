import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, z.object({
		organizationItemParticipant: idSchema,
	}).parseAsync)

	const organizationItemParticipant = await database.query.organizationItemParticipants.findFirst({
		where: eq(organizationItemParticipants.id, params.organizationItemParticipant),
		columns: {
			id: false,
		},
	})

	if(!organizationItemParticipant) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sitzungsteilnahmegruppe nicht gefunden',
			data: {
				organizationItemParticipantId: params.organizationItemParticipant,
			},
		})
	}

	return organizationItemParticipant
})