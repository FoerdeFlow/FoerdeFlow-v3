import { eq } from 'drizzle-orm'

/**
 * Looks up which organization item owns a bank account.
 *
 * Statements, transactions and their assignments do not carry the
 * organization item themselves, so every handler touching them checks the
 * permission against the owner of the account read here.
 *
 * @param tx - The transaction to read in
 * @param id - The bank account to look up
 * @returns The identifier of the owning organization item
 */
export async function getBankAccountScope(
	tx: ReturnType<typeof useDatabase>,
	id: string,
) {
	const account = await tx.query.bankAccounts.findFirst({
		where: eq(bankAccounts.id, id),
		columns: {
			organizationItem: true,
		},
	})

	if(!account) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Bankkonto nicht gefunden',
			data: {
				bankAccountId: id,
			},
		})
	}

	return account.organizationItem
}
