import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('travelTransportReasons.create')

	const database = useDatabase()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(travelTransportReasons).omit({ id: true }).extend({
			transportModes: z.array(idSchema).min(1),
			roles: z.array(idSchema).default([]),
		}).parseAsync(data))

	const { transportModes, roles, ...reason } = body

	return await database.transaction(async (tx) => {
		const result = await tx
			.insert(travelTransportReasons)
			.values(reason)
			.returning({ id: travelTransportReasons.id })

		const [ created ] = result
		if(created) await writeTravelTransportReasonLinks(tx, created.id, { transportModes, roles })

		return result
	})
})
