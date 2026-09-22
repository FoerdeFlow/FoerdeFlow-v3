import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('locations.delete')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		location: idSchema,
	}).parseAsync(data))

	// Ohne die Prüfung bliebe nur ein Fremdschlüsselfehler der Datenbank, der
	// dem Nutzer nicht sagt, was den Ort noch festhält.
	const usage = await getLocationUsage(database, params.location)
	if(usage.events > 0 || usage.sessions > 0 || usage.children > 0) {
		throw createError({
			statusCode: 409,
			statusMessage: 'Der Ort wird noch verwendet',
			data: {
				locationId: params.location,
				...usage,
			},
		})
	}

	const result = await database
		.delete(locations)
		.where(eq(locations.id, params.location))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Ort nicht gefunden',
			data: {
				locationId: params.location,
			},
		})
	}
})
