import { eq } from 'drizzle-orm'

/**
 * Looks up which organization item owns an inventory item.
 *
 * Every handler that touches a loan has to check the permission against the
 * owning body, and the loan itself does not carry it, so they all read it here.
 *
 * @param tx - The transaction to read in
 * @param id - The inventory item to look up
 * @returns The identifier of the owning organization item
 */
export async function getInventoryItemScope(
	tx: ReturnType<typeof useDatabase>,
	id: string,
) {
	const item = await tx.query.inventoryItems.findFirst({
		where: eq(inventoryItems.id, id),
		columns: {
			organizationItem: true,
		},
	})

	if(!item) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Gegenstand nicht gefunden',
			data: {
				inventoryItemId: id,
			},
		})
	}

	return item.organizationItem
}
