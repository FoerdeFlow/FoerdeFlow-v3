export type MembershipStatus = 'active' | 'future' | 'ended'

/**
 * The state of a membership at a point in time. It follows the rule the server
 * applies to the effective members in `getEffectiveMembers`: a membership counts
 * from its start up to, but not including, its end, so that a member list says
 * the same as session attendance and roles.
 *
 * @param membership - The dates of the membership, open where missing
 * @param now - The point in time to look at
 * @returns Whether the membership has yet to start, runs or has ended
 */
export function getMembershipStatus(
	membership: {
		startDate: string | Date | null
		endDate: string | Date | null
	},
	now = new Date(),
): MembershipStatus {
	if(membership.startDate && new Date(membership.startDate) > now) return 'future'
	if(membership.endDate && new Date(membership.endDate) <= now) return 'ended'
	return 'active'
}
