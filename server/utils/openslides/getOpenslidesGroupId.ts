import type { OpenslidesClient } from 'openslides-client'

export async function getOpenslidesGroupId(
	client: OpenslidesClient,
	committeeId: string,
	sessionId: string,
	groupId: string,
): Promise<number> {
	const openslidesMeetingId = await getOpenslidesMeetingId(client, committeeId, sessionId)
	const { id: openslidesGroupId } = await client.presenters.search_for_id_by_external_id({
		collection: 'group',
		external_id: groupId,
		context_id: openslidesMeetingId,
	})
	return openslidesGroupId
}
