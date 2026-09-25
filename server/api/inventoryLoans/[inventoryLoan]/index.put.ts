import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		inventoryLoan: idSchema,
	}).parseAsync(data))

	// Der Gegenstand bleibt außen vor: eine Ausleihe wandert nicht auf ein
	// anderes Stück. Die Rückgabe läuft über ihren eigenen Endpunkt.
	const loanSchema = createUpdateSchema(inventoryLoans).omit({
		id: true,
		item: true,
		lentBy: true,
		returnedAt: true,
		returnedTo: true,
	})
	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		...loanSchema.shape,
		lentAt: z.coerce.date(),
		dueAt: z.coerce.date(),
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

	await checkPermission('inventoryLoans.update', { organizationItem })

	await database
		.update(inventoryLoans)
		.set(body)
		.where(eq(inventoryLoans.id, params.inventoryLoan))
})
