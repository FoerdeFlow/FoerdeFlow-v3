import { eq } from 'drizzle-orm'
import type { OpenslidesClient } from 'openslides-client'

async function assignToMeeting(
	client: OpenslidesClient,
	email: string,
	committeeId: string,
	sessionId: string,
	groupIds: string[],
) {
	const openslidesPersonId = await getOpenslidesPersonId(client, email)
	if(!openslidesPersonId) return
	const openslidesMeetingId = await getOpenslidesMeetingId(client, committeeId, sessionId)
	const openslidesGroupIds = await Promise.all(
		groupIds.map(async (groupId) => await getOpenslidesGroupId(client, committeeId, sessionId, groupId)),
	)

	await client.user.update({
		id: openslidesPersonId,
		meeting_id: openslidesMeetingId,
		group_ids: openslidesGroupIds,
	})
}

export async function syncOpenslidesParticipants(client: OpenslidesClient, sessionId: string) {
	const database = useDatabase()

	const session = await database.query.sessions.findFirst({
		where: eq(sessions.id, sessionId),
		columns: {
			organizationItem: true,
		},
	})
	if(!session) return

	const sessionMembers = await getSessionMembers(sessionId, { isSessionParticipant: true })
	const uniquePersons = new Set<string>([
		...sessionMembers.groups.flatMap((group) => group.members),
		...sessionMembers.guests,
	].map((member) => member.person.email))
	const persons = [ ...uniquePersons ]
		.map((email) => ({
			email,
			groupIds: sessionMembers.groups
				.filter((group) => group.members
					.some((member) => member.person.email === email),
				)
				.map((group) => group.id),
		}))
		.map((person) => ({
			email: person.email,
			groupIds: person.groupIds.length > 0 ? person.groupIds : [ 'Default' ],
		}))

	for(const person of persons) {
		await assignToMeeting(
			client,
			person.email,
			session.organizationItem,
			sessionId,
			person.groupIds,
		)
	}

	const openslidesMeetingId = await getOpenslidesMeetingId(client, session.organizationItem, sessionId)
	const [ { user_ids: openslidesMeetingUserIds } ] = await client.get({
		collection: 'meeting',
		ids: [ openslidesMeetingId ],
		fields: [ 'user_ids' ],
	})
	const assignedUsers = await client.get({
		collection: 'user',
		ids: openslidesMeetingUserIds,
		fields: [ 'saml_id' ],
	})
	const extraneousUsers = assignedUsers.filter((user) => user.saml_id && !uniquePersons.has(user.saml_id))
	await Promise.all(extraneousUsers.map(async (user) => {
		await assignToMeeting(
			client,
			user.saml_id,
			session.organizationItem,
			sessionId,
			[],
		)
	}))
}
