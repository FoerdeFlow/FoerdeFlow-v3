import type { OpenslidesClient } from 'openslides-client'

export async function getOpenslidesPersonId(
	client: OpenslidesClient,
	email: string,
): Promise<number | null> {
	const [ [ { id = null } ] ] = await client.presenters.search_users({
		permission_type: 'organization',
		permission_id: 1,
		search: [ { saml_id: email } ],
	})
	return id
}
