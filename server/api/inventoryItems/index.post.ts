import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	const itemSchema = createInsertSchema(inventoryItems).omit({ id: true })
	const body = await readValidatedBody(event, async (data) => await itemSchema.parseAsync(data))

	await checkPermission('inventoryItems.create', { organizationItem: body.organizationItem })

	const database = useDatabase()

	const [ result = null ] = await database
		.insert(inventoryItems)
		.values(body)
		.returning({ id: inventoryItems.id })

	if(result === null) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Gegenstand konnte nicht erstellt werden',
		})
	}

	return result
})
