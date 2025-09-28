import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('membershipEndReasons.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		membershipEndReason: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(membershipEndReasons)
		.where(eq(membershipEndReasons.id, params.membershipEndReason))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Grund des Mitgliedschaftsendes nicht gefunden',
			data: {
				membershipEndReasonId: params.membershipEndReason,
			},
		})
	}
})
