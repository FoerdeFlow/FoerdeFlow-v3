import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: idSchema,
	}).parseAsync(data))

	await checkBankAccountReadPermission(query.organizationItem)

	const database = useDatabase()

	return await database.query.bankAccounts.findMany({
		where: eq(bankAccounts.organizationItem, query.organizationItem),
		orderBy: [ asc(bankAccounts.name) ],
	})
})
