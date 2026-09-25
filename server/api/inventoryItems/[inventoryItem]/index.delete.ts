import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		inventoryItem: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const organizationItem = await getInventoryItemScope(database, params.inventoryItem)

	await checkPermission('inventoryItems.delete', { organizationItem })

	// Ohne die Prüfung bliebe nur ein Fremdschlüsselfehler der Datenbank, der
	// nicht sagt, dass der Gegenstand seine Ausleihen noch festhält.
	const usage = await getInventoryItemUsage(database, params.inventoryItem)
	if(usage.loans > 0) {
		throw createError({
			statusCode: 409,
			statusMessage: 'Der Gegenstand hat noch Ausleihen',
			data: {
				inventoryItemId: params.inventoryItem,
				...usage,
			},
		})
	}

	const result = await database
		.delete(inventoryItems)
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
