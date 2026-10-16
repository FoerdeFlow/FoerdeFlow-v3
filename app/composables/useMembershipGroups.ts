import type { MaybeRefOrGetter } from 'vue'

interface GroupableMembership {
	startDate: string | Date | null
	endDate: string | Date | null
	membershipType: {
		name: string
		sortOrder: number
	}
}

/**
 * Orders memberships into the running, the upcoming and the ended ones, for
 * `KernTable` as `data` and `groups`. Running memberships come first, ordered by
 * the order of their type and then by `compareWithinType`; upcoming ones by
 * their start, ended ones by their end, the most recent first.
 *
 * @param memberships - The memberships to group
 * @param compareWithinType - Orders two memberships of the same type
 * @returns The memberships in that order and the groups to split them into
 */
export function useMembershipGroups<T extends GroupableMembership>(
	memberships: MaybeRefOrGetter<T[] | null | undefined>,
	compareWithinType: (a: T, b: T) => number,
) {
	return computed(() => {
		const now = new Date()
		const time = (date: string | Date | null) => date ? new Date(date).getTime() : 0
		const compare = (a: T, b: T) =>
			a.membershipType.sortOrder - b.membershipType.sortOrder ||
			a.membershipType.name.localeCompare(b.membershipType.name, 'de') ||
			compareWithinType(a, b)

		const status = new Map((toValue(memberships) ?? []).map((membership) =>
			[ membership, getMembershipStatus(membership, now) ]))
		const withStatus = (wanted: MembershipStatus) =>
			[ ...status ].filter(([ , value ]) => value === wanted).map(([ membership ]) => membership)

		const active = withStatus('active').sort(compare)
		const future = withStatus('future')
			.sort((a, b) => time(a.startDate) - time(b.startDate) || compare(a, b))
		const ended = withStatus('ended')
			.sort((a, b) => time(b.endDate) - time(a.endDate) || compare(a, b))

		return {
			items: [ ...active, ...future, ...ended ],
			groups: [
				{
					key: 'active',
					label: `Aktiv (${active.length})`,
					includes: (membership: T) => status.get(membership) === 'active',
				},
				{
					key: 'future',
					label: `Künftig (${future.length})`,
					includes: (membership: T) => status.get(membership) === 'future',
				},
				{
					key: 'ended',
					label: `Beendet (${ended.length})`,
					includes: (membership: T) => status.get(membership) === 'ended',
					muted: true,
				},
			],
		}
	})
}
