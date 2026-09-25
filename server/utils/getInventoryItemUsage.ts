import { and, count, eq, isNull } from 'drizzle-orm'

/**
 * Counts the loans of an inventory item.
 *
 * Deleting asks whether anything would be left behind, because a bare foreign
 * key error does not tell the user that the item still carries its history.
 *
 * @param tx - The transaction to read in
 * @param id - The inventory item to count the loans of
 * @returns The number of loans in total and of those still open
 */
export async function getInventoryItemUsage(
	tx: ReturnType<typeof useDatabase>,
	id: string,
) {
	const [ loanUsage ] = await tx
		.select({ value: count() })
		.from(inventoryLoans)
		.where(eq(inventoryLoans.item, id))

	const [ openUsage ] = await tx
		.select({ value: count() })
		.from(inventoryLoans)
		.where(and(eq(inventoryLoans.item, id), isNull(inventoryLoans.returnedAt)))

	return {
		loans: loanUsage?.value ?? 0,
		openLoans: openUsage?.value ?? 0,
	}
}
