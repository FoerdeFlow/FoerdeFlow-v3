import { inArray } from 'drizzle-orm'

/**
 * Checks the two places a session or an event is held at.
 *
 * A videoconference room belongs in the online field and nowhere else, and an
 * ad-hoc location stays with the organization item that wrote it down until
 * somebody turns it into a proper one.
 *
 * @param tx - The transaction to read in
 * @param choice - The physical and the online location of the entry
 * @param organizationItem - The organization item the entry belongs to
 */
export async function checkLocationChoice(
	tx: ReturnType<typeof useDatabase>,
	choice: {
		location?: string | null
		onlineLocation?: string | null
	},
	organizationItem: string,
) {
	const ids = [ choice.location, choice.onlineLocation ]
		.filter((id) => typeof id === 'string')
	if(ids.length === 0) return

	const found = await tx.query.locations.findMany({
		where: inArray(locations.id, ids),
		columns: {
			id: true,
			type: true,
			organizationItem: true,
			url: true,
		},
	})

	for(const id of ids) {
		const location = found.find((item) => item.id === id)
		if(!location) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Der angegebene Ort wurde nicht gefunden',
				data: { locationId: id },
			})
		}

		if(location.type === 'adHoc' && location.organizationItem !== organizationItem) {
			throw createError({
				statusCode: 403,
				statusMessage: 'Der gewählte Ort gehört zu einer anderen Organisationseinheit',
				data: { locationId: id },
			})
		}

		if(id === choice.location && location.type === 'online') {
			throw createError({
				statusCode: 400,
				statusMessage: 'Ein Videokonferenzraum gehört in das Feld für den Online-Ort',
				data: { locationId: id },
			})
		}

		if(id === choice.onlineLocation && location.type !== 'online' && !location.url) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Der Online-Ort braucht einen Link zur Videokonferenz',
				data: { locationId: id },
			})
		}
	}
}
