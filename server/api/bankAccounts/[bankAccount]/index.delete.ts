import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		bankAccount: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const organizationItem = await getBankAccountScope(database, params.bankAccount)

	await checkPermission('bankAccounts.delete', { organizationItem })

	// An account with imported statements is still referenced by them, so the
	// database refuses to delete it.
	await database
		.delete(bankAccounts)
		.where(eq(bankAccounts.id, params.bankAccount))
})
