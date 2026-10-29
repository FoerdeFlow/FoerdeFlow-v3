import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		bankAccount: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) => await bankAccountSchema
		.omit({ organizationItem: true })
		.strict()
		.parseAsync(data))

	const database = useDatabase()

	const organizationItem = await getBankAccountScope(database, params.bankAccount)

	await checkPermission('bankAccounts.update', { organizationItem })

	await database
		.update(bankAccounts)
		.set(body)
		.where(eq(bankAccounts.id, params.bankAccount))
})
