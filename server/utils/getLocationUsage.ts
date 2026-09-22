import { count, eq, or } from 'drizzle-orm'

/**
 * Counts what still points at a location.
 *
 * Deleting asks whether anything would be left behind, and merging tells the
 * user how many entries the merge rewrites, so both read the same numbers.
 *
 * @param tx - The transaction to read in
 * @param id - The location to count the references of
 * @returns The number of events, sessions and rooms referring to the location
 */
export async function getLocationUsage(
	tx: ReturnType<typeof useDatabase>,
	id: string,
) {
	const [ eventUsage ] = await tx
		.select({ value: count() })
		.from(events)
		.where(or(eq(events.location, id), eq(events.onlineLocation, id)))

	const [ sessionUsage ] = await tx
		.select({ value: count() })
		.from(sessions)
		.where(or(eq(sessions.location, id), eq(sessions.onlineLocation, id)))

	const [ childUsage ] = await tx
		.select({ value: count() })
		.from(locations)
		.where(eq(locations.parent, id))

	return {
		events: eventUsage?.value ?? 0,
		sessions: sessionUsage?.value ?? 0,
		children: childUsage?.value ?? 0,
	}
}
