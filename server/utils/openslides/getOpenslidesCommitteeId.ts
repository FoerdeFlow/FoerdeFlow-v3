import type { OpenslidesClient } from 'openslides-client'

export async function getOpenslidesCommitteeId(client: OpenslidesClient, committeeId: string): Promise<number> {
	const { id: openslidesCommitteeId } = await client.presenters.search_for_id_by_external_id({
		collection: 'committee',
		external_id: committeeId,
		context_id: 1,
	})
	return openslidesCommitteeId
}
