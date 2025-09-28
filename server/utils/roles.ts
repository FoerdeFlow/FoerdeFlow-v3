import { and, eq, isNull, or } from 'drizzle-orm'

export async function getAnonymousRoles() {
	const database = useDatabase()

	const occupants = await database.query.roleOccupants.findMany({
		where: and(
			isNull(roleOccupants.person),
			isNull(roleOccupants.membershipType),
			isNull(roleOccupants.organizationType),
			isNull(roleOccupants.organizationItem),
		),
		columns: {},
		with: {
			role: true,
		},
	})

	return occupants.map((occupant) => occupant.role)
}

export async function getPersonRoles(person: string) {
	const database = useDatabase()

	const effectiveMemberships = await getEffectiveMemberships({
		type: 'person',
		person,
	})

	const occupants = await database.query.roleOccupants.findMany({
		where: and(
			or(
				isNull(roleOccupants.person),
				eq(roleOccupants.person, person),
			),
			or(
				and(
					isNull(roleOccupants.membershipType),
					isNull(roleOccupants.organizationType),
					isNull(roleOccupants.organizationItem),
				),
				...effectiveMemberships.map((membership) => and(
					eq(
						roleOccupants.membershipType,
						membership.membershipType.id,
					),
					or(
						isNull(roleOccupants.organizationType),
						eq(
							roleOccupants.organizationType,
							membership.organizationItem.organizationType,
						),
					),
					or(
						isNull(roleOccupants.organizationItem),
						eq(
							roleOccupants.organizationItem,
							membership.organizationItem.id,
						),
					),
				)),
			),
		),
		columns: {},
		with: {
			role: true,
		},
	})

	return occupants.map((occupant) => occupant.role)
}

export async function getRolePermissions(role: string) {
	const database = useDatabase()

	return await database.query.rolePermissions.findMany({
		where: eq(rolePermissions.role, role),
		columns: {
			permission: true,
		},
	})
}
