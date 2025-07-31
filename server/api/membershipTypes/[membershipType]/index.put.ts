import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, z.object({
		membershipType: idSchema,
	}).parseAsync)

	const body = await readValidatedBody(event, createUpdateSchema(membershipTypes).omit({ id: true }).parseAsync)

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
