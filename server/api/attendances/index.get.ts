import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

function sortPerson(a: { firstName: string, lastName: string }, b: { firstName: string, lastName: string }) {
	if(a.lastName === b.lastName) {
		return a.firstName.localeCompare(b.firstName)
	}
	return a.lastName.localeCompare(b.lastName)
}

export default defineEventHandler(async (event) => {
	await checkPermission('attendances.read')

	const database = useDatabase()

	const query = await getValidatedQuery(event, async (data) => await z.object({
		session: z.uuid(),
	}).parseAsync(data))

	const session = await database.query.sessions.findFirst({
		where: eq(sessions.id, query.session),
		with: {
			organizationItem: true,
		},
	})

	if(!session) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sitzung nicht gefunden',
			data: {
				sessionId: query.session,
			},
		})
	}

	const groups = await database.query.organizationItemGroups.findMany({
		where: and(
			eq(organizationItemGroups.organizationItem, session.organizationItem.id),
			eq(organizationItemGroups.isSessionParticipant, true),
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
		name: group.groupName,
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
		session,
		groups: groupsWithStatus,
		guests: attendances
			.filter((attendance) => !groupsWithStatus
				.some((group) => group.members
					.some((member) => member.id === attendance.id),
				),
			)
			.sort(({ person: a }, { person: b }) => sortPerson(a, b)),
	}
})
