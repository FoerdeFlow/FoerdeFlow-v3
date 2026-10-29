import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		bankAccount: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const result = await database.query.bankAccounts.findFirst({
		where: eq(bankAccounts.id, params.bankAccount),
		with: {
			organizationItem: true,
			// The balance of the account is the one of its latest statement.
			statements: {
				orderBy: [ desc(bankStatements.createdAt) ],
				limit: 1,
				columns: {
					id: true,
					createdAt: true,
					toDate: true,
					closingBalance: true,
				},
			},
		},
		columns: {
			organizationItem: false,
		},
	})

	await checkBankAccountReadPermission(result?.organizationItem.id)

	if(!result) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Bankkonto nicht gefunden',
			data: {
				bankAccountId: params.bankAccount,
			},
		})
	}

	const { statements, ...account } = result

	return {
		...account,
		latestStatement: statements[0] ?? null,
	}
})
