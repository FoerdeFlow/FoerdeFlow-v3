import type { EventContext } from '~~/server/types'

import { and, eq, isNotNull } from 'drizzle-orm'

/**
 * Lists the advances whose claim is overdue: the journey ended longer ago than
 * the period of § 4 and no claim was approved for it. Such an advance is to be
 * paid back (§ 9). A claim that is still being decided on keeps the advance
 * off the list.
 */
export default defineEventHandler(async (event) => {
	if(!(event.context as EventContext).user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Unauthorized',
		})
	}

	const now = new Date()
	const permits = await readTravelPermits(isNotNull(travelPermits.advanceAmount))

	const database = useDatabase()
	const pending = await database
		.select({ data: workflowProcessMutations.data })
		.from(workflowProcessMutations)
		.innerJoin(workflowMutations, eq(workflowMutations.id, workflowProcessMutations.mutation))
		.innerJoin(workflowProcesses, eq(workflowProcesses.id, workflowProcessMutations.process))
		.where(and(
			eq(workflowMutations.table, 'travelClaims'),
			eq(workflowProcesses.status, 'pending'),
		))
	const claimed = new Set(pending.map((row) =>
		(row.data as { permit?: string } | null)?.permit ?? null))

	return permits
		.filter((permit) => permit.claims.length === 0 && !claimed.has(permit.id))
		// Without a workflow at hand the period of the regulation applies.
		.filter((permit) => travelClaimLate(permit.endDate, travelMeta(null).claimDeadlineDays, now))
		.map((permit) => ({
			...permit,
			deadline: travelClaimDeadline(permit.endDate, travelMeta(null).claimDeadlineDays),
		}))
})
