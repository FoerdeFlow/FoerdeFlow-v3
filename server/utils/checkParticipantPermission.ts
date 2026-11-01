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
		assignee: 'initiator' | 'referencedPerson' | 'organizationItem' | 'referencedOrganizationItem'
		assigneeReferencedPerson: string | null
		assigneeOrganizationItem: string | null
		assigneeReferencedOrganizationItem: string | null
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
			const referencedPerson = await readProcessMutationField(
				tx,
				process.id,
				participant.assigneeReferencedPerson,
			)
			if(!referencedPerson || referencedPerson !== (event.context as EventContext).user?.person?.id) {
				throw createError({
					statusCode: 403,
					statusMessage: 'Forbidden',
					data: 'User is not the referenced person assigned to the step',
				})
			}
			break
		}
		case 'organizationItem':
		case 'referencedOrganizationItem': {
			// A referenced organization item is resolved first, from then on it
			// is checked like one that is fixed by the workflow.
			const organizationItem = participant.assignee === 'referencedOrganizationItem'
				? await readProcessMutationField(
					tx,
					process.id,
					participant.assigneeReferencedOrganizationItem,
				)
				: participant.assigneeOrganizationItem

			try {
				await checkPermission(
					'workflowProcesses.update',
					{ organizationItem: organizationItem ?? '' },
					{ exactScopeMatch: true },
				)
			} catch(error) {
				if(
					!options.allowMembershipFallback || !organizationItem ||
					!(event.context as EventContext).user?.memberships?.some((membership) =>
						membership.organizationItem.id === organizationItem,
					)
				) {
					throw error
				}
			}
			break
		}
	}
}
