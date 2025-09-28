import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('membershipEndReasons.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		membershipEndReason: idSchema,
	}).parseAsync(data))

	const membershipEndReason = await database.query.membershipEndReasons.findFirst({
		where: eq(membershipEndReasons.id, params.membershipEndReason),
	})

	if(!membershipEndReason) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Grund des Mitgliedschaftsendes nicht gefunden',
			data: {
				membershipEndReasonId: params.membershipEndReason,
			},
		})
	}

	return membershipEndReason
})
