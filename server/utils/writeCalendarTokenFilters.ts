import { eq } from 'drizzle-orm'

/**
 * Schreibt die Filter eines Kalender-Abos neu. Die Auswahl ist eine Menge ohne
 * eigene Identität, deshalb werden die bestehenden Zeilen verworfen und die
 * neuen eingefügt, statt sie einzeln abzugleichen.
 *
 * @param tx - Die Transaktion, in der das Abo geschrieben wird
 * @param calendarToken - Das Abo, dessen Filter gemeint sind
 * @param filters - Die gewählten Arten und Gremien; leer heißt „alle“
 */
export async function writeCalendarTokenFilters(
	tx: ReturnType<typeof useDatabase>,
	calendarToken: string,
	filters: { kinds: string[], organizationItems: string[] },
): Promise<void> {
	await tx
		.delete(calendarTokenKinds)
		.where(eq(calendarTokenKinds.calendarToken, calendarToken))
	await tx
		.delete(calendarTokenOrganizationItems)
		.where(eq(calendarTokenOrganizationItems.calendarToken, calendarToken))

	const kinds = [ ...new Set(filters.kinds) ].map((kind) => ({
		calendarToken,
		eventType: kind === calendarSessionKind ? null : kind,
	}))
	if(kinds.length > 0) await tx.insert(calendarTokenKinds).values(kinds)

	const organizationItems = [ ...new Set(filters.organizationItems) ]
		.map((organizationItem) => ({ calendarToken, organizationItem }))
	if(organizationItems.length > 0) {
		await tx.insert(calendarTokenOrganizationItems).values(organizationItems)
	}
}
