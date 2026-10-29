import { count, desc, eq, getTableColumns } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		bankAccount: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const organizationItem = await getBankAccountScope(database, query.bankAccount)

	await checkPermission('bankTransactions.read', { organizationItem })

	const result = await database
		.select({
			...getTableColumns(bankStatements),
			transactionCount: count(bankTransactions.id),
			uploadedBy: {
				id: persons.id,
				firstName: persons.firstName,
				lastName: persons.lastName,
				callName: persons.callName,
			},
		})
		.from(bankStatements)
		.leftJoin(bankTransactions, eq(bankTransactions.statement, bankStatements.id))
		.leftJoin(persons, eq(persons.id, bankStatements.uploadedBy))
		.where(eq(bankStatements.bankAccount, query.bankAccount))
		.groupBy(bankStatements.id, persons.id)
		.orderBy(desc(bankStatements.createdAt))

	return result.map((statement) => ({
		...statement,
		uploadedBy: withDisplayName(statement.uploadedBy?.id ? statement.uploadedBy : null),
	}))
})
