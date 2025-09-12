import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		role: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(roles).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(roles)
		.set(body)
		.where(eq(roles.id, params.role))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Rolle nicht gefunden',
			data: {
				roleId: params.role,
			},
		})
	}
})
