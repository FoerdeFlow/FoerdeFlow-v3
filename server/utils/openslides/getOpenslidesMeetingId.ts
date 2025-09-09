import type { OpenslidesClient } from 'openslides-client'

export async function getOpenslidesMeetingId(
	client: OpenslidesClient,
	committeeId: string,
	sessionId: string,
): Promise<number> {
	const openslidesCommitteeId = await getOpenslidesCommitteeId(client, committeeId)
	const { id: openslidesMeetingId } = await client.presenters.search_for_id_by_external_id({
		collection: 'meeting',
		external_id: sessionId,
		context_id: openslidesCommitteeId,
	})
	return openslidesMeetingId
}
