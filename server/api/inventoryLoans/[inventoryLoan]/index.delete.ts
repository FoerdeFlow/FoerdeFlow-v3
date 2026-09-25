import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		inventoryLoan: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const existing = await database.query.inventoryLoans.findFirst({
		where: eq(inventoryLoans.id, params.inventoryLoan),
		columns: {
			item: true,
		},
	})

	if(!existing) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Ausleihe nicht gefunden',
			data: {
				inventoryLoanId: params.inventoryLoan,
			},
		})
	}

	const organizationItem = await getInventoryItemScope(database, existing.item)

	await checkPermission('inventoryLoans.delete', { organizationItem })

	await database
		.delete(inventoryLoans)
		.where(eq(inventoryLoans.id, params.inventoryLoan))
})
