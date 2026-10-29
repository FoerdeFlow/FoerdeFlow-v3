/**
 * Checks that the current user may see the bank accounts of an organization
 * item.
 *
 * Whoever may read the payments of an account has to know the account as well,
 * without being allowed to maintain the accounts.
 *
 * @param organizationItem - The organization item owning the accounts
 */
export async function checkBankAccountReadPermission(organizationItem: string | undefined) {
	if(hasPermission('bankTransactions.read', { organizationItem })) {
		return
	}

	await checkPermission('bankAccounts.read', { organizationItem })
}
