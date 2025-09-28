import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('membershipEndReasons.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		membershipEndReason: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(membershipEndReasons).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(membershipEndReasons)
		.set(body)
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
