import type { EventContext } from '~~/server/types'

import { eq } from 'drizzle-orm'
import { z } from 'zod'

/**
 * Dokumentiert die Rückgabe eines ausgeliehenen Gegenstands. Die Ausleihe bleibt
 * als Teil der Historie stehen und bekommt nur ihren Abschluss.
 */
export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		inventoryLoan: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		returnedAt: z.coerce.date().optional(),
		note: z.string().max(4096).nullish(),
	}).parseAsync(data))

	const database = useDatabase()

	const existing = await database.query.inventoryLoans.findFirst({
		where: eq(inventoryLoans.id, params.inventoryLoan),
		columns: {
			item: true,
			returnedAt: true,
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

	if(existing.returnedAt !== null) {
		throw createError({
			statusCode: 409,
			statusMessage: 'Die Ausleihe ist bereits zurückgegeben',
			data: {
				inventoryLoanId: params.inventoryLoan,
			},
		})
	}

	const context = event.context as EventContext

	await database
		.update(inventoryLoans)
		.set({
			returnedAt: body.returnedAt ?? new Date(),
			returnedTo: context.user?.person?.id ?? null,
			// Eine Bemerkung zum Zustand ersetzt die der Herausgabe, sonst bleibt
			// die bestehende stehen.
			...(body.note === undefined ? {} : { note: body.note }),
		})
		.where(eq(inventoryLoans.id, params.inventoryLoan))
})
