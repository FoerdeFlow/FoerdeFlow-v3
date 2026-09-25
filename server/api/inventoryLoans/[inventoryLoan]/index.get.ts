import { eq } from 'drizzle-orm'
import { existsSync } from 'node:fs'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		inventoryLoan: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const result = await database.query.inventoryLoans.findFirst({
		where: eq(inventoryLoans.id, params.inventoryLoan),
		with: {
			item: true,
			borrower: {
				with: {
					course: true,
				},
				columns: {
					id: true,
					email: true,
					firstName: true,
					lastName: true,
					callName: true,
					gender: true,
					pronouns: true,
				},
			},
			lentBy: true,
			returnedTo: true,
		},
		columns: {
			item: false,
			borrower: false,
			lentBy: false,
			returnedTo: false,
		},
	})

	if(!result) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Ausleihe nicht gefunden',
			data: {
				inventoryLoanId: params.inventoryLoan,
			},
		})
	}

	await checkPermission('inventoryLoans.read', {
		organizationItem: result.item.organizationItem,
	})

	// Der Entleiher kommt in der Gestalt zurück, in der ihn die Personenauswahl
	// im Formular erwartet.
	return {
		...result,
		borrower: {
			...withDisplayName(result.borrower),
			hasPhoto: existsSync(`./data/${result.borrower.id}`),
		},
	}
})
