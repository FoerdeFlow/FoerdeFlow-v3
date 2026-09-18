import { existsSync } from 'node:fs'
import z from 'zod'

import type { DestructureArray } from '#shared/types'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: z.uuid(),
	}).parseAsync(data))

	await checkPermission('memberships.read', { organizationItem: query.organizationItem })

	const database = useDatabase()

	const memberships = await database.query.memberships.findMany({
		where: (memberships, { eq }) => eq(memberships.organizationItem, query.organizationItem),
		with: {
			membershipType: true,
			endReason: true,
			memberPerson: {
				with: {
					course: true,
				},
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					callName: true,
					gender: true,
					pronouns: true,
				},
			},
			memberOrganizationItem: true,
		},
		columns: {
			organizationItem: false,
			membershipType: false,
			memberPerson: false,
			memberOrganizationItem: false,
			endReason: false,
		},
	})

	const result = memberships.map((membership) => ({
		...membership,
		memberPerson: membership.memberPerson
			? {
				...withDisplayName(membership.memberPerson),
				hasPhoto: existsSync(`./data/${membership.memberPerson.id}`),
			}
			: null,
	}))

	return result as (DestructureArray<typeof result> & (
		{
			memberType: 'person'
			memberPerson: Exclude<
				(DestructureArray<typeof result>)['memberPerson'],
				null
			>
			memberOrganizationItem: null
		} | {
			memberType: 'organizationItem'
			memberPerson: null
			memberOrganizationItem: Exclude<
				(DestructureArray<typeof result>)['memberOrganizationItem'],
				null
			>
		}
	))[]
})
