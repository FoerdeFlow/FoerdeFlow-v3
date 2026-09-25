import type { EventContext } from '~~/server/types'

import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'

export default defineEventHandler(async (event) => {
	// Die Rückgabe wird nicht beim Anlegen erfasst, und wer herausgibt, steht
	// nicht im Körper, sondern ergibt sich aus der handelnden Person.
	const loanSchema = createInsertSchema(inventoryLoans).omit({
		id: true,
		lentBy: true,
		returnedAt: true,
		returnedTo: true,
	})
	const body = await readValidatedBody(event, async (data) =>
		await loanSchema.parseAsync(
			await z.looseObject({
				lentAt: z.coerce.date(),
				dueAt: z.coerce.date(),
			}).parseAsync(data),
		),
	)

	const database = useDatabase()

	const organizationItem = await getInventoryItemScope(database, body.item)

	await checkPermission('inventoryLoans.create', { organizationItem })

	const context = event.context as EventContext

	const [ result = null ] = await database
		.insert(inventoryLoans)
		.values({ ...body, lentBy: context.user?.person?.id ?? null })
		.returning({ id: inventoryLoans.id })

	if(result === null) {
		throw createError({
			statusCode: 500,
			statusMessage: 'Ausleihe konnte nicht erstellt werden',
		})
	}

	return result
})
