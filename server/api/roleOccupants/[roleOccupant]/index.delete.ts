import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('roleOccupants.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		roleOccupant: idSchema,
	}).parseAsync(data))

	const result = await database
		.delete(roleOccupants)
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
