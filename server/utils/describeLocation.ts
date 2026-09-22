/**
 * Nennt den Ort eines Termins so, wie ihn ein Kalenderprogramm im
 * LOCATION-Feld anzeigen soll: den Ort selbst, um seine Anschrift ergänzt,
 * und ersatzweise den Videokonferenzraum.
 *
 * @param location - Der Ort, an dem der Termin stattfindet
 * @param onlineLocation - Der Videokonferenzraum, falls vorhanden
 * @returns Der Ort als Text, oder null, wenn keiner feststeht
 */
export function describeLocation(
	location: Parameters<typeof formatLocation>[0] & {
		postalAddress?: string | null
		parent?: { postalAddress?: string | null } | null
	} | null,
	onlineLocation: { name: string } | null,
): string | null {
	if(!location) return onlineLocation?.name ?? null

	const name = formatLocation(location)
	// Ein Raum trägt die Anschrift seines Gebäudes, alle anderen ihre eigene.
	const address = location.postalAddress ?? location.parent?.postalAddress
	return address ? `${name}, ${address}` : name
}
