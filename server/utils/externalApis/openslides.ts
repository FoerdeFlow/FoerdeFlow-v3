type SessionHeaders = Record<string, string>

async function getOpenslidesSessionHeaders(): Promise<SessionHeaders> {
	const runtimeConfig = useRuntimeConfig()
	const response = await $fetch.raw<void>(`${runtimeConfig.openslides.server}/system/auth/login`, {
		method: 'POST',
		body: {
			username: runtimeConfig.openslides.username,
			password: runtimeConfig.openslides.password,
		},
	})
	return {
		'Authentication': response.headers.get('Authentication') || '',
		'Cookie': response.headers.getSetCookie().map(item => item.split(';', 2)[0]).join('; '),
	}
}

async function requestAutoupdate(sessionHeaders: SessionHeaders, payload: Record<string, any>[]) {
	const runtimeConfig = useRuntimeConfig()
	return await $fetch(`${runtimeConfig.openslides.server}/system/autoupdate?single=true`, {
		method: 'POST',
		headers: sessionHeaders,
		body: payload,
		parseResponse: JSON.parse,
	})
}

async function requestPresenter(sessionHeaders: SessionHeaders, payload: Record<string, any>[]) {
	const runtimeConfig = useRuntimeConfig()
	return await $fetch(`${runtimeConfig.openslides.server}/system/presenter/handle_request`, {
		method: 'POST',
		headers: sessionHeaders,
		body: payload,
		parseResponse: JSON.parse,
	})
}

async function requestAction(sessionHeaders: SessionHeaders, payload: Record<string, any>[]) {
	const runtimeConfig = useRuntimeConfig()
	return await $fetch(`${runtimeConfig.openslides.server}/system/action/handle_request`, {
		method: 'POST',
		headers: sessionHeaders,
		body: payload,
		parseResponse: JSON.parse,
	})
}

async function getIdByExternalId(session: SessionHeaders, collection: string, externalId: string, contextId: number): Promise<number> {
	const response = await requestPresenter(session, [
		{
			presenter: 'search_for_id_by_external_id',
			data: {
				collection,
				external_id: externalId,
				context_id: contextId,
			},
		},
	]) as any
	return response[0]?.id
}

export async function getOpenslidesSession(period: number, number: number): Promise<{ id: number }> {
	const sessionHeaders = await getOpenslidesSessionHeaders()
	const committeeId = await getIdByExternalId(sessionHeaders, 'committee', 'StuPa', 1)
	const sessionId = await getIdByExternalId(sessionHeaders, 'meeting', `StuPa-${period}-${number}`, committeeId)
	return { id: sessionId }
}

export interface OpenslidesSessionData {
	period: number
	number: number
	time?: Date
	location?: string
}

function getOpenslidesSessionData(data: OpenslidesSessionData): Record<string, any> {
	const prettyPeriod = `${data.period}/${data.period + 1}`
	const prettyNumber = data.number.toString().padStart(2, '0')
	const prettyTime = data.time ? `${data.time.getHours().toString().padStart(2, '0')}:${data.time.getMinutes().toString().padStart(2, '0')} Uhr` : ''
	return {
		name: `StuPa-Sitzung ${prettyPeriod} - ${prettyNumber}`,
		description: `${data.number}. Sitzung des Studierendenparlaments der HAW Kiel ${prettyTime ? `| ${prettyTime}` : ''}`,
		start_time: data.time ? data.time.getTime() / 1000 : null,
		end_time: data.time ? data.time.getTime() / 1000 : null,
		location: data.location || '',
	}
}

export async function createOpenslidesSession(data: OpenslidesSessionData): Promise<{ id: number }> {
	const sessionHeaders = await getOpenslidesSessionHeaders()
	const committeeId = await getIdByExternalId(sessionHeaders, 'committee', 'StuPa', 1)
	const templateId = await getIdByExternalId(sessionHeaders, 'meeting', 'Template-StuPa', committeeId)
	const result = await requestAction(sessionHeaders, [
		{
			action: 'meeting.clone',
			data: [
				{
					...getOpenslidesSessionData(data),
					meeting_id: templateId,
					committee_id: committeeId,
					external_id: `StuPa-${data.period}-${data.number}`,
				},
			],
		},
	]) as any
	if(!result.success || !result.results?.[0]?.[0]?.id) {
		throw new Error(`Failed to create OpenSlides session: ${result.error}`)
	}
	return {
		id: result.results[0][0].id
	}
}

export async function updateOpenslidesSession(period: number, number: number, data: {
	time?: Date
	location?: string
}): Promise<void> {
	const sessionHeaders = await getOpenslidesSessionHeaders()
	const committeeId = await getIdByExternalId(sessionHeaders, 'committee', 'StuPa', 1)
	const sessionId = await getIdByExternalId(sessionHeaders, 'meeting', `StuPa-${period}-${number}`, committeeId)
	await requestAction(sessionHeaders, [
		{
			action: 'meeting.update',
			data: [
				{
					...getOpenslidesSessionData({ period, number, ...data }),
					id: sessionId,
				},
			],
		},
	]) as any
}

export async function searchOpenslidesUser(mail: string): Promise<{ id: number } | null> {
	const sessionHeaders = await getOpenslidesSessionHeaders()
	const result = await requestPresenter(sessionHeaders, [
		{
			presenter: 'search_users',
			data: {
				permission_type: 'organization',
				permission_id: 1,
				search: [ { saml_id: mail } ],
			},
		},
	]) as any
	if(!result?.[0]?.[0]?.[0]?.id) return null
	return {
		id: result?.[0]?.[0]?.[0]?.id,
	}
}

export interface OpenslidesUserData {
	firstName: string
	lastName: string
	email: string
	callName?: string
	pronouns?: string
}

function getOpenslidesUserData(data: OpenslidesUserData): Record<string, any> {
	return {
		username: data.email,
		email: data.email,
		saml_id: data.email,
		pronoun: data.pronouns || '',
		first_name: data.callName || data.firstName,
		last_name: data.lastName,
		is_active: true,
		is_physical_person: true,
		can_change_own_password: false,
		title: '',
	}
}

export async function createOpenslidesUser(data: OpenslidesUserData): Promise<{ id: number }> {
	const sessionHeaders = await getOpenslidesSessionHeaders()
	const result = await requestAction(sessionHeaders, [
		{
			action: 'user.create',
			data: [
				{
					...getOpenslidesUserData(data),
				},
			],
		},
	]) as any
	if(!result.success || !result.results?.[0]?.[0]?.id) {
		throw new Error(`Failed to create OpenSlides user: ${result.error}`)
	}
	return {
		id: result.results[0][0].id
	}
}

export async function updateOpenslidesUser(userId: number, data: OpenslidesUserData): Promise<void> {
	const sessionHeaders = await getOpenslidesSessionHeaders()
	await requestAction(sessionHeaders, [
		{
			action: 'user.update',
			data: [
				{
					...getOpenslidesUserData(data),
					id: userId,
				},
			],
		},
	]) as any
}

export async function createOrUpdateOpenslidesUser(data: OpenslidesUserData): Promise<number> {
	const openslidesUser = await searchOpenslidesUser(data.email)
	if(openslidesUser) {
		await updateOpenslidesUser(openslidesUser.id, data)
		return openslidesUser.id
	}
	const result = await createOpenslidesUser(data)
	return result.id
}

export async function getOpenslidesMeetingGroup(meetingId: number, externalId: string): Promise<{ id: number }> {
	const sessionHeaders = await getOpenslidesSessionHeaders()
	const groupId = await getIdByExternalId(sessionHeaders, 'group', externalId, meetingId)
	if(!groupId) {
		throw new Error(`Group with external ID "${externalId}" not found in OpenSlides meeting ${meetingId}.`)
	}
	return {
		id: groupId,
	}
}

export async function assignOpenslidesUserToMeeting(userId: number, sessionId: number, groupIds: number[]): Promise<void> {
	const sessionHeaders = await getOpenslidesSessionHeaders()
	await requestAction(sessionHeaders, [
		{
			action: 'user.update',
			data: [
				{
					id: userId,
					meeting_id: sessionId,
					group_ids: groupIds,
				},
			],
		},
	])
}

export async function setOpenslidesPresence(userId: number, sessionId: number, attendance: 'present' | 'absent' | 'excused'): Promise<void> {
	const sessionHeaders = await getOpenslidesSessionHeaders()
	await requestAction(sessionHeaders, [
		{
			action: 'user.set_present',
			data: [
				{
					id: userId,
					meeting_id: sessionId,
					present: attendance === 'present',
				},
			],
		},
	])
}
