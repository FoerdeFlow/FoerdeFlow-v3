import z from 'zod'
import type { DestructureArray } from '~~/shared/types'

export default defineEventHandler(async (event) => {
	await checkPermission('memberships.read')

	const database = useDatabase()

	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: z.uuid(),
	}).parseAsync(data))

	const memberships = await database.query.memberships.findMany({
		where: (memberships, { eq }) => eq(memberships.organizationItem, query.organizationItem),
		with: {
			membershipType: true,
			endReason: true,
			memberPerson: true,
			memberOrganizationItem: true,
		},
		columns: {
			organizationItem: false,
		},
	})

	return memberships as (DestructureArray<typeof memberships> & (
		{
			memberType: 'person'
			memberPerson: Exclude<
				(DestructureArray<typeof memberships>)['memberPerson'],
				null
			>
			memberOrganizationItem: null
		} | {
			memberType: 'organization_item'
			memberPerson: null
			memberOrganizationItem: Exclude<
				(DestructureArray<typeof memberships>)['memberOrganizationItem'],
				null
			>
		}
	))[]
})
