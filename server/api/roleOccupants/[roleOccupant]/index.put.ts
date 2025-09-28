import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('roleOccupants.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		roleOccupant: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(roleOccupants).omit({ id: true }).parseAsync(data))

	const result = await database
		.update(roleOccupants)
		.set(body)
		.where(eq(roleOccupants.id, params.roleOccupant))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Rolleninhaber nicht gefunden',
			data: {
				roleOccupantId: params.roleOccupant,
			},
		})
	}
})
