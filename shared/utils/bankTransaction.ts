export type BankTransactionStatus = 'unassigned' | 'partial' | 'assigned'

/**
 * Tells how far a bank transaction is assigned to budgets.
 *
 * @param transaction - The transaction with the sum of its assigned parts
 * @returns The status of the transaction
 */
export function getBankTransactionStatus(transaction: {
	amount: number
	assignedAmount: number
}): BankTransactionStatus {
	if(transaction.assignedAmount <= 0) return 'unassigned'
	return currencySum(transaction.amount, -transaction.assignedAmount) > 0 ? 'partial' : 'assigned'
}

/**
 * Gives the amount of a bank transaction with its sign, negative for money
 * that went out.
 *
 * @param transaction - The transaction
 * @returns The signed amount
 */
export function getSignedAmount(transaction: {
	amount: number
	direction: 'credit' | 'debit'
}) {
	return transaction.direction === 'debit' ? -transaction.amount : transaction.amount
}
