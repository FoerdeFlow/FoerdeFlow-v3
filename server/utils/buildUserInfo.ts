import { eq } from 'drizzle-orm'

import type { UserInfo } from '#shared/types'

/**
 * Builds the user information of a person the way the request context carries
 * it: the person, their effective memberships, their roles and the permissions
 * following from those roles.
 *
 * @param person - The person whose user information is built
 * @returns The user information, or `null` if the person does not exist
 */
export async function buildUserInfo(person: string): Promise<
	(UserInfo & { person: NonNullable<UserInfo['person']> }) | null
> {
	const database = useDatabase()

	const personData = await database.query.persons.findFirst({
		where: eq(persons.id, person),
	})
	/*
	 * Eine fehlende Person ist hier kein Fehler: Die Middleware behandelt die
	 * echte und die angenommene Identität unterschiedlich und entscheidet selbst,
	 * ob daraus eine Abweisung wird.
	 */
	if(!personData) return null

	const memberships = await getEffectiveMemberships({
		type: 'person',
		person: personData.id,
	})
	const roles = await getPersonRoles(personData.id)
	// Administratoren erhalten alle Berechtigungen global, wie in `checkPermission`.
	const permissions = roles.some((role) => role.isAdmin)
		? availablePermissions.map((permission) => ({
			permission: permission.id,
			organizationItem: false as const,
		}))
		: (await Promise.all(
			roles.map(async (role) => await getRolePermissions(role.id)),
		)).flat()

	return {
		person: withDisplayName(personData),
		memberships,
		roles,
		permissions,
	}
}
