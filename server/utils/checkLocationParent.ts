import { eq } from 'drizzle-orm'

/**
 * Checks that a room is placed in a building.
 *
 * The table can only demand that a room has a parent at all; that the parent is
 * a building and not another room is a rule the handlers have to keep.
 *
 * @param tx - The transaction to read in
 * @param body - The parsed body of the location
 */
export async function checkLocationParent(
	tx: ReturnType<typeof useDatabase>,
	body: LocationBody,
) {
	if(body.type !== 'room') return

	const parent = await tx.query.locations.findFirst({
		where: eq(locations.id, body.parent),
		columns: {
			type: true,
		},
	})

	if(!parent) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Das angegebene Gebäude wurde nicht gefunden',
			data: { parentId: body.parent },
		})
	}

	if(parent.type !== 'building') {
		throw createError({
			statusCode: 400,
			statusMessage: 'Ein Raum liegt in einem Gebäude',
			data: { parentId: body.parent, parentType: parent.type },
		})
	}
}
