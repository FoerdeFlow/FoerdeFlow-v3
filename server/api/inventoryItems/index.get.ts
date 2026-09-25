import z from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: idSchema,
	}).parseAsync(data))

	await checkPermission('inventoryItems.read', { organizationItem: query.organizationItem })

	const database = useDatabase()

	const result = await database.query.inventoryItems.findMany({
		where: (inventoryItems, { eq }) => eq(inventoryItems.organizationItem, query.organizationItem),
		with: {
			location: {
				with: {
					parent: true,
				},
				columns: {
					parent: false,
				},
			},
			// Höchstens eine Zeile: mehr als eine offene Ausleihe je Gegenstand
			// schließt `one_open_loan_per_item` aus.
			loans: {
				where: (loans, { isNull }) => isNull(loans.returnedAt),
				with: {
					borrower: true,
				},
				columns: {
					item: false,
					borrower: false,
					lentBy: false,
					returnedTo: false,
				},
			},
		},
		columns: {
			organizationItem: false,
			location: false,
		},
		orderBy: (inventoryItems, { asc }) => [
			asc(inventoryItems.inventoryNumber),
			asc(inventoryItems.name),
		],
	})

	return result
})
