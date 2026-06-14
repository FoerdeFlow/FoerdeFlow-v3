import { eq } from 'drizzle-orm'
import { existsSync } from 'node:fs'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		membership: idSchema,
	}).parseAsync(data))

	const membership = await database.query.memberships.findFirst({
		where: eq(memberships.id, params.membership),
		with: {
			membershipType: true,
			endReason: true,
			memberPerson: {
				with: {
					course: true,
				},
				columns: {
					id: true,
					email: true,
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
			organizationItem: true,
			comment: true,
			startDate: true,
			endDate: true,
			memberType: true,
		},
	})

	await checkPermission('memberships.read', { organizationItem: membership?.organizationItem })

	if(!membership) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Mitgliedschaft nicht gefunden',
			data: {
				membershipId: params.membership,
			},
		})
	}

	const result = {
		...membership,
		memberPerson: membership.memberPerson
			? {
				...membership.memberPerson,
				hasPhoto: existsSync(`./data/${membership.memberPerson.id}`),
			}
			: null,
	}

	return result as typeof result & (
		{
			memberType: 'person'
			memberPerson: Exclude<typeof result.memberPerson, null>
			memberOrganizationItem: null
		} | {
			memberType: 'organization_item'
			memberPerson: null
			memberOrganizationItem: Exclude<typeof result.memberOrganizationItem, null>
		}
	)
})
