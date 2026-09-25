import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		inventoryItem: idSchema,
	}).parseAsync(data))

	// Das Gremium bleibt außen vor: ein Gegenstand wechselt nicht den Besitzer.
	const itemSchema = createUpdateSchema(inventoryItems).omit({ id: true, organizationItem: true })
	const body = await readValidatedBody(event, async (data) =>
		await z.strictObject(itemSchema.shape).parseAsync(data))

	const database = useDatabase()

	const organizationItem = await getInventoryItemScope(database, params.inventoryItem)

	await checkPermission('inventoryItems.update', { organizationItem })

	const result = await database
		.update(inventoryItems)
		.set(body)
		.where(eq(inventoryItems.id, params.inventoryItem))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Gegenstand nicht gefunden',
			data: {
				inventoryItemId: params.inventoryItem,
			},
		})
	}
})
