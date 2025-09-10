import { and, gt, inArray, isNull, lt, or } from 'drizzle-orm'
import type { DestructureArray } from '#shared/types'

export async function getEffectiveMembers(organizationItems: string[], membershipTypes: string[] | null) {
	const database = useDatabase()

	const members = await database.query.memberships.findMany({
		where: and(
			inArray(memberships.organizationItem, organizationItems),
			...(membershipTypes ? [ inArray(memberships.membershipType, membershipTypes) ] : []),
			or(
				isNull(memberships.startDate),
				lt(memberships.startDate, new Date()),
			),
			or(
				isNull(memberships.endDate),
				gt(memberships.endDate, new Date()),
			),
		),
		columns: {
			memberType: true,
			memberOrganizationItem: true,
		},
		with: {
			memberPerson: true,
		},
	})

	const result: NonNullable<DestructureArray<typeof members>['memberPerson']>[] = []
	for(const entry of members) {
		switch(entry.memberType) {
			case 'person':
				if(!entry.memberPerson) break
				result.push(entry.memberPerson)
				break
			case 'organizationItem':
				if(!entry.memberOrganizationItem) break
				result.push(...await getEffectiveMembers([ entry.memberOrganizationItem ], null))
				break
		}
	}
	return result
}
