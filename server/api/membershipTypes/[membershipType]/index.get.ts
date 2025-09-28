import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('membershipTypes.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		membershipType: idSchema,
	}).parseAsync(data))

	const membershipType = await database.query.membershipTypes.findFirst({
		where: eq(membershipTypes.id, params.membershipType),
	})

	if(!membershipType) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Mitgliedschaftsart nicht gefunden',
			data: {
				membershipTypeId: params.membershipType,
			},
		})
	}

	return membershipType
})
