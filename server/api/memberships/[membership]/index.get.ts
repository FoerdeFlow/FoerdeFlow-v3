import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('memberships.read')

	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		membership: idSchema,
	}).parseAsync(data))

	const membership = await database.query.memberships.findFirst({
		where: eq(memberships.id, params.membership),
		with: {
			membershipType: true,
			endReason: true,
			memberPerson: true,
			memberOrganizationItem: true,
		},
		columns: {
			id: false,
		},
	})

	if(!membership) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Mitgliedschaft nicht gefunden',
			data: {
				membershipId: params.membership,
			},
		})
	}

	return membership as typeof membership & (
		{
			memberType: 'person'
			memberPerson: Exclude<typeof membership.memberPerson, null>
			memberOrganizationItem: null
		} | {
			memberType: 'organization_item'
			memberPerson: null
			memberOrganizationItem: Exclude<typeof membership.memberOrganizationItem, null>
		}
	)
})
