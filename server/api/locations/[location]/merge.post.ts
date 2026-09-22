import { eq } from 'drizzle-orm'
import { z } from 'zod'

/**
 * Führt einen doppelt erfassten Ort mit einem bestehenden zusammen. Alles, was
 * auf die Quelle zeigt, zeigt danach auf das Ziel, und die Quelle verschwindet.
 */
export default defineEventHandler(async (event) => {
	await checkPermission('locations.update')

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		location: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		target: idSchema,
	}).parseAsync(data))

	if(body.target === params.location) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Ein Ort kann nicht mit sich selbst zusammengeführt werden',
			data: { locationId: params.location },
		})
	}

	const database = useDatabase()

	return await database.transaction(async (tx) => {
		const source = await tx.query.locations.findFirst({
			where: eq(locations.id, params.location),
			columns: { id: true },
		})
		if(!source) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Ort nicht gefunden',
				data: { locationId: params.location },
			})
		}

		const target = await tx.query.locations.findFirst({
			where: eq(locations.id, body.target),
			columns: { id: true, type: true },
		})
		if(!target) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Der Ort, in den zusammengeführt werden soll, wurde nicht gefunden',
				data: { locationId: body.target },
			})
		}

		const usage = await getLocationUsage(tx, params.location)
		if(usage.children > 0 && target.type !== 'building') {
			throw createError({
				statusCode: 409,
				statusMessage: 'Die Räume des Gebäudes lassen sich nur in ein Gebäude übernehmen',
				data: { locationId: params.location, rooms: usage.children },
			})
		}

		await tx.update(events)
			.set({ location: target.id })
			.where(eq(events.location, params.location))
		await tx.update(events)
			.set({ onlineLocation: target.id })
			.where(eq(events.onlineLocation, params.location))
		await tx.update(sessions)
			.set({ location: target.id })
			.where(eq(sessions.location, params.location))
		await tx.update(sessions)
			.set({ onlineLocation: target.id })
			.where(eq(sessions.onlineLocation, params.location))
		await tx.update(locations)
			.set({ parent: target.id })
			.where(eq(locations.parent, params.location))

		await tx.delete(locations).where(eq(locations.id, params.location))

		return { id: target.id, ...usage }
	})
})
