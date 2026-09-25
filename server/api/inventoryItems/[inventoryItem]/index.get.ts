import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		inventoryItem: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const result = await database.query.inventoryItems.findFirst({
		where: eq(inventoryItems.id, params.inventoryItem),
		with: {
			organizationItem: true,
			location: {
				with: {
					parent: true,
				},
				columns: {
					parent: false,
				},
			},
			// Die vollständige Geschichte des Gegenstands, die jüngste zuerst.
			loans: {
				with: {
					borrower: true,
					lentBy: true,
					returnedTo: true,
				},
				columns: {
					item: false,
					borrower: false,
					lentBy: false,
					returnedTo: false,
				},
				orderBy: (loans, { desc }) => [
					desc(loans.lentAt),
				],
			},
		},
		columns: {
			organizationItem: false,
			location: false,
		},
	})

	if(!result) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Gegenstand nicht gefunden',
			data: {
				inventoryItemId: params.inventoryItem,
			},
		})
	}

	await checkPermission('inventoryItems.read', { organizationItem: result.organizationItem.id })

	return result
})
