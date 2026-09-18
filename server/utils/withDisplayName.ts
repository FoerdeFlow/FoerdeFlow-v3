interface NamedPerson {
	firstName: string
	lastName: string
	callName?: string | null
}

/**
 * Adds the display name that every API carries alongside a person, so that the
 * clients read one key instead of assembling the name themselves.
 *
 * @param person - The person to name
 * @returns The person together with their display name
 */
export function withDisplayName<T extends NamedPerson>(
	person: T,
): T & { displayName: string }
/**
 * Adds the display name that every API carries alongside a person, so that the
 * clients read one key instead of assembling the name themselves.
 *
 * @param person - The person to name, if there is one
 * @returns The person together with their display name, or `null` if there is none
 */
export function withDisplayName<T extends NamedPerson>(
	person: T | null | undefined,
): (T & { displayName: string }) | null
export function withDisplayName<T extends NamedPerson>(
	person: T | null | undefined,
) {
	if(!person) return null
	return {
		...person,
		displayName: formatPerson(person),
	}
}
