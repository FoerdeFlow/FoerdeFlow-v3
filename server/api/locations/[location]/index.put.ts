import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('locations.update')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		location: idSchema,
	}).parseAsync(data))

	// Das Überführen eines Ad-hoc-Ortes ist eine gewöhnliche Bearbeitung: die Art
	// wechselt, und die Felder der neuen Art werden nachgetragen.
	const body = await readValidatedBody(event, async (data) =>
		await locationBodySchema.parseAsync(data))

	if(body.type === 'room' && body.parent === params.location) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Ein Raum kann nicht in sich selbst liegen',
			data: { locationId: params.location },
		})
	}

	await checkLocationParent(database, body)

	if(body.type !== 'building') {
		const usage = await getLocationUsage(database, params.location)
		if(usage.children > 0) {
			throw createError({
				statusCode: 409,
				statusMessage: 'In diesem Gebäude liegen noch Räume',
				data: { locationId: params.location, rooms: usage.children },
			})
		}
	}

	const result = await database
		.update(locations)
		.set(toLocationValues(body))
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
