import type { OpenslidesClient } from 'openslides-client'

export async function getOpenslidesTemplateMeetingId(client: OpenslidesClient, committeeId: string): Promise<number> {
	const openslidesCommitteeId = await getOpenslidesCommitteeId(client, committeeId)
	const { id: openslidesTemplateMeetingId } = await client.presenters.search_for_id_by_external_id({
		collection: 'meeting',
		external_id: `${committeeId}-Template`,
		context_id: openslidesCommitteeId,
	})
	return openslidesTemplateMeetingId
}
