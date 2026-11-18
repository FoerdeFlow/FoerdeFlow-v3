import { asc, desc, eq, gt, sql } from 'drizzle-orm'

/**
 * Lists the bank accounts of every organization item whose payments the
 * current user may see, with what is still left to assign.
 */
export default defineEventHandler(async () => {
	const database = useDatabase()

	const accounts = await database.query.bankAccounts.findMany({
		with: {
			organizationItem: {
				columns: {
					id: true,
					name: true,
				},
			},
			// The balance of the account is the one of its latest statement.
			statements: {
				orderBy: [ desc(bankStatements.createdAt), desc(bankStatements.uploadedAt) ],
				limit: 1,
				columns: {
					createdAt: true,
					toDate: true,
					closingBalance: true,
				},
			},
		},
		columns: {
			organizationItem: false,
		},
		orderBy: [ asc(bankAccounts.name) ],
	})

	const visible = accounts.filter((account) =>
		hasPermission('bankTransactions.read', { organizationItem: account.organizationItem.id }))

	if(visible.length === 0) {
		return []
	}

	// A transaction is open as long as its parts do not add up to its amount,
	// see `getBankTransactionStatus`.
	const assigned = database
		.select({
			transaction: bankTransactionAssignments.transaction,
			amount: sql<string>`sum(${bankTransactionAssignments.amount})`.as('assigned_amount'),
		})
		.from(bankTransactionAssignments)
		.groupBy(bankTransactionAssignments.transaction)
		.as('assigned')

	const remaining = sql`${bankTransactions.amount} - coalesce(${assigned.amount}, 0)`

	const open = await database
		.select({
			bankAccount: bankTransactions.bankAccount,
			count: sql<number>`count(*)`.mapWith(Number),
			amount: sql<string>`sum(${remaining})`.mapWith(Number),
		})
		.from(bankTransactions)
		.leftJoin(assigned, eq(assigned.transaction, bankTransactions.id))
		.where(gt(remaining, 0))
		.groupBy(bankTransactions.bankAccount)

	return visible.map(({ statements, ...account }) => {
		const item = open.find((entry) => entry.bankAccount === account.id)
		return {
			...account,
			latestStatement: statements[0] ?? null,
			openCount: item?.count ?? 0,
			openAmount: item?.amount ?? 0,
		}
	})
})
