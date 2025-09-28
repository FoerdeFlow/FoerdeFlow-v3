import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('membershipTypes.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		membershipType: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(membershipTypes).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(membershipTypes)
		.set(body)
		.where(eq(membershipTypes.id, params.membershipType))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Mitgliedschaftsart nicht gefunden',
			data: {
				membershipTypeId: params.membershipType,
			},
		})
	}
})
