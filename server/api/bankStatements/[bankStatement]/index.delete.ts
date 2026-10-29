import { and, eq, exists } from 'drizzle-orm'
import { unlink } from 'node:fs/promises'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		bankStatement: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const statement = await database.query.bankStatements.findFirst({
		where: eq(bankStatements.id, params.bankStatement),
		columns: {
			bankAccount: true,
		},
	})

	if(!statement) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kontoauszug nicht gefunden',
			data: {
				bankStatementId: params.bankStatement,
			},
		})
	}

	await checkPermission('bankTransactions.delete', {
		organizationItem: await getBankAccountScope(database, statement.bankAccount),
	})

	await database.transaction(async (tx) => {
		const assigned = await tx
			.select({ id: bankTransactions.id })
			.from(bankTransactions)
			.where(and(
				eq(bankTransactions.statement, params.bankStatement),
				exists(tx
					.select()
					.from(bankTransactionAssignments)
					.where(eq(bankTransactionAssignments.transaction, bankTransactions.id))),
			))
			.limit(1)

		if(assigned.length > 0) {
			throw createError({
				statusCode: 409,
				statusMessage: 'Zahlungen dieses Kontoauszugs sind bereits zugeordnet',
			})
		}

		await tx
			.delete(bankTransactions)
			.where(eq(bankTransactions.statement, params.bankStatement))

		await tx
			.delete(bankStatements)
			.where(eq(bankStatements.id, params.bankStatement))
	})

	await unlink(`./data/bankStatement_${params.bankStatement}.xml`).catch(() => { /* already gone */ })
})
