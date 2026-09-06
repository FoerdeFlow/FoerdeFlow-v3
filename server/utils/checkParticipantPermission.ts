import type { EventContext } from '../types'

/**
 * Checks whether the current user acts as the given workflow participant of a process.
 *
 * Throws if the user does not hold the assignment. With `allowMembershipFallback`,
 * plain membership in the assigned organization item is sufficient, which is what
 * read-only access relies on.
 *
 * @param tx - The database connection or transaction to use
 * @param process - The process the participant belongs to
 * @param participant - The participant assignment to check, e.g. a workflow step or signature
 * @param options - Whether to accept plain membership in the assigned organization item
 */
export async function checkParticipantPermission(
	tx: ReturnType<typeof useDatabase>,
	process: {
		id: string
		initiatorType: 'person' | 'organizationItem'
		initiatorPerson: string | null
		initiatorOrganizationItem: string | null
	},
	participant: {
		assignee: 'initiator' | 'referencedPerson' | 'organizationItem'
		assigneeReferencedPerson: string | null
		assigneeOrganizationItem: string | null
	},
	options: {
		allowMembershipFallback?: boolean
	} = {},
) {
	const event = useEvent()

	switch(participant.assignee) {
		case 'initiator':
			switch(process.initiatorType) {
				case 'person':
					if(
						process.initiatorPerson !==
						(event.context as EventContext).user?.person?.id
					) {
						throw createError({
							statusCode: 403,
							statusMessage: 'Forbidden',
							data: 'User is not the initiator of the process',
						})
					}
					break
				case 'organizationItem':
					await checkPermission(
						'workflowProcesses.update',
						{ organizationItem: process.initiatorOrganizationItem ?? '' },
						{ exactScopeMatch: true },
					)
					break
			}
			break
		case 'referencedPerson': {
			const [ referencedPersonTable, ...referencedPersonSteps ] =
				participant.assigneeReferencedPerson?.split('.') ?? []
			if(!referencedPersonTable || referencedPersonSteps.length <= 0) {
				throw createError({
					statusCode: 403,
					statusMessage: 'Forbidden',
					data: 'Invalid referenced person assignment',
				})
			}

			const mutation = await tx.query.workflowProcessMutations.findFirst({
				where: (tbl, { and, eq, exists }) => and(
					eq(tbl.process, process.id),
					exists(tx.select()
						.from(workflowMutations)
						.where(and(
							eq(workflowMutations.id, tbl.mutation),
							eq(workflowMutations.table, referencedPersonTable),
						))),
				),
				columns: {
					data: true,
				},
			})
			if(!mutation) {
				throw createError({
					statusCode: 403,
					statusMessage: 'Forbidden',
					data: 'Referenced person mutation not found',
				})
			}

			let referencedPersonData: unknown = mutation.data
			for(const referencedPersonStep of referencedPersonSteps) {
				if(typeof referencedPersonData === 'object' && referencedPersonData !== null) {
					const record = referencedPersonData as Record<string, unknown>
					referencedPersonData = record[referencedPersonStep]
				} else {
					referencedPersonData = undefined
					break
				}
			}

			const referencedPersonId = typeof referencedPersonData === 'string'
				? referencedPersonData
				: undefined
			if(referencedPersonId !== (event.context as EventContext).user?.person?.id) {
				throw createError({
					statusCode: 403,
					statusMessage: 'Forbidden',
					data: 'User is not the referenced person assigned to the step',
				})
			}
			break
		}
		case 'organizationItem':
			try {
				await checkPermission(
					'workflowProcesses.update',
					{ organizationItem: participant.assigneeOrganizationItem ?? '' },
					{ exactScopeMatch: true },
				)
			} catch(error) {
				if(
					!options.allowMembershipFallback ||
					!(event.context as EventContext).user?.memberships?.some((membership) =>
						membership.organizationItem.id === participant.assigneeOrganizationItem,
					)
				) {
					throw error
				}
			}
			break
	}
}
