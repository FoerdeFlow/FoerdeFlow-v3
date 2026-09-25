/**
 * Derives the state of a loan.
 *
 * The badge, the item list and the loan overview all show the same three
 * states, so they all ask here rather than each comparing the dates itself.
 *
 * @param loan - The loan to look at
 * @param now - The moment to measure the due date against
 * @returns Whether the loan is returned, overdue or simply open
 */
export function getLoanStatus(
	loan: {
		dueAt: string | Date
		returnedAt?: string | Date | null
	},
	now: Date = new Date(),
): 'returned' | 'overdue' | 'open' {
	if(loan.returnedAt) return 'returned'
	return new Date(loan.dueAt) < now ? 'overdue' : 'open'
}

/**
 * Derives the state of an inventory item from its open loan.
 *
 * An item carries at most one open loan, so the list hands in whatever the API
 * returned: an empty array means the item is on the shelf.
 *
 * @param item - The item together with its open loans
 * @param now - The moment to measure the due date against
 * @returns Whether the item is available, lent out or overdue
 */
export function getItemStatus(
	item: {
		loans?: {
			dueAt: string | Date
			returnedAt?: string | Date | null
		}[]
	},
	now: Date = new Date(),
): 'available' | 'lent' | 'overdue' {
	const loan = item.loans?.find((item) => !item.returnedAt)
	if(!loan) return 'available'
	return getLoanStatus(loan, now) === 'overdue' ? 'overdue' : 'lent'
}
