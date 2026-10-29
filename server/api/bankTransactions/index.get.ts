import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		bankAccount: idSchema,
		from: z.iso.date().optional(),
		to: z.iso.date().optional(),
	}).parseAsync(data))

	const database = useDatabase()

	const organizationItem = await getBankAccountScope(database, query.bankAccount)

	await checkPermission('bankTransactions.read', { organizationItem })

	const result = await database.query.bankTransactions.findMany({
		where: and(
			eq(bankTransactions.bankAccount, query.bankAccount),
			query.from ? gte(bankTransactions.bookingDate, query.from) : undefined,
			query.to ? lte(bankTransactions.bookingDate, query.to) : undefined,
		),
		with: {
			assignments: {
				with: {
					budgetPlanItem: {
						columns: {
							id: true,
							ord: true,
							title: true,
						},
						with: {
							plan: {
								columns: {
									id: true,
									startDate: true,
									endDate: true,
								},
								with: {
									budget: {
										columns: {
											id: true,
											code: true,
											name: true,
										},
									},
								},
							},
						},
					},
					budget: {
						columns: {
							id: true,
							code: true,
							name: true,
						},
					},
					paymentOrder: {
						columns: {
							id: true,
							title: true,
							amount: true,
						},
					},
				},
				columns: {
					transaction: false,
				},
				orderBy: [ asc(bankTransactionAssignments.amount) ],
			},
		},
		columns: {
			importKey: false,
		},
		// Lets the assignment suggest a transfer, without telling which account,
		// as it may belong to another organization item. The subquery is written
		// out, because Drizzle points every column in here to the outer table.
		extras: (table) => ({
			counterpartyIsOwnAccount: sql<boolean>`exists (
				select 1 from bank_accounts own where own.iban = ${table.counterpartyIban}
			)`.as('counterparty_is_own_account'),
		}),
		orderBy: [
			desc(bankTransactions.bookingDate),
			asc(bankTransactions.id),
		],
	})

	return result.map((transaction) => ({
		...transaction,
		assignedAmount: currencySum(...transaction.assignments.map((item) => item.amount)),
	}))
})
