import { and, eq } from 'drizzle-orm'

export async function getSessionMembers(
	sessionId: string,
	filter: {
		isSessionParticipant?: boolean
	} = {},
) {
	const database = useDatabase()

	const session = await database.query.sessions.findFirst({
		where: eq(sessions.id, sessionId),
		with: {
			organizationItem: true,
		},
		columns: {
			organizationItem: false,
		},
	})

	if(!session) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sitzung nicht gefunden',
			data: {
				sessionId,
			},
		})
	}

	const groups = await database.query.organizationItemGroups.findMany({
		where: and(
			eq(organizationItemGroups.organizationItem, session.organizationItem.id),
			...(typeof filter.isSessionParticipant === 'boolean'
				? [
					eq(organizationItemGroups.isSessionParticipant, filter.isSessionParticipant),
				]
				: []),
		),
		with: {
			members: {
				columns: {
					organizationItemGroup: false,
				},
			},
		},
		columns: {
			organizationItem: false,
			isSessionParticipant: false,
		},
	})

	const attendances = await database.query.sessionAttendances.findMany({
		where: eq(sessionAttendances.session, session.id),
		columns: {
			id: true,
			status: true,
		},
		with: {
			person: true,
		},
	})

	const groupsWithStatus = await Promise.all(groups.map(async (group) => ({
		id: group.id,
		groupName: group.groupName,
		roleName: group.roleName,
		members: (await Promise.all(group.members.map(async (member) =>
			(await getEffectiveMembers([ member.organizationItem ], [ member.membershipType ]))
				.map((person) => attendances
					.find((attendance) => attendance.person.id === person.id) ??
					{
						id: null,
						person,
						status: null,
					},
				),
		)))
			.flat()
			.sort(({ person: a }, { person: b }) => sortPerson(a, b)),
	})))

	return {
		groups: groupsWithStatus,
		guests: attendances
			.filter((attendance) => !groupsWithStatus
				.some((group) => group.members
					.some((member) => member.id === attendance.id),
				),
			)
			.sort(({ person: a }, { person: b }) => sortPerson(a, b)),
	}
}
