import { and, eq, gt, inArray, isNull, lte, or } from 'drizzle-orm'

import type { DestructureArray } from '#shared/types'

export async function getEffectiveMembers(
	organizationItems: string[],
	membershipTypes: string[] | null,
	effectiveDate: Date = new Date(),
) {
	const database = useDatabase()

	const members = await database.query.memberships.findMany({
		where: and(
			inArray(memberships.organizationItem, organizationItems),
			...(membershipTypes ? [ inArray(memberships.membershipType, membershipTypes) ] : []),
			or(
				isNull(memberships.startDate),
				lte(memberships.startDate, effectiveDate),
			),
			or(
				isNull(memberships.endDate),
				gt(memberships.endDate, effectiveDate),
			),
		),
		columns: {
			memberType: true,
			memberOrganizationItem: true,
		},
		with: {
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
				result.push(...await getEffectiveMembers([ entry.memberOrganizationItem ], null, effectiveDate))
				break
		}
	}
	return result
}

export async function getEffectiveMemberships(member: {
	type: 'person'
	person: string
} | {
	type: 'organizationItem'
	organizationItem: string
}) {
	const database = useDatabase()

	const members = await database.query.memberships.findMany({
		where: and(
			eq(memberships.memberType, member.type),
			...(member.type === 'person'
				? [
					eq(memberships.memberPerson, member.person),
				]
				: []),
			...(member.type === 'organizationItem'
				? [
					eq(memberships.memberOrganizationItem, member.organizationItem),
				]
				: []),
		),
		columns: {},
		with: {
			membershipType: true,
			organizationItem: true,
		},
	})

	const result = [
		...members,
		...(await Promise.all(
			members.map(async (membership) =>
				await getEffectiveMemberships({
					type: 'organizationItem',
					organizationItem: membership.organizationItem.id,
				}),
			),
		)).flat(),
	] as typeof members

	return result
}
