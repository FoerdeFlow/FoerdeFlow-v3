/**
 * Resolves the organization item that acts as a workflow participant of a process.
 *
 * Besides an organization item fixed by the workflow, this covers an initiating
 * organization item and one that the data of the process names.
 *
 * @param tx - The database connection or transaction to use
 * @param process - The process the participant belongs to
 * @param participant - The participant assignment, e.g. a workflow step or signature
 * @returns The ID of the organization item, `null` if no organization item acts
 */
export async function getParticipantOrganizationItem(
	tx: ReturnType<typeof useDatabase>,
	process: {
		id: string
		initiatorType: 'person' | 'organizationItem'
		initiatorOrganizationItem: string | null
	},
	participant: {
		assignee: 'initiator' | 'referencedPerson' | 'organizationItem' | 'referencedOrganizationItem'
		assigneeOrganizationItem: string | null
		assigneeReferencedOrganizationItem: string | null
	},
) {
	switch(participant.assignee) {
		case 'organizationItem':
			return participant.assigneeOrganizationItem
		case 'initiator':
			return process.initiatorType === 'organizationItem'
				? process.initiatorOrganizationItem
				: null
		case 'referencedOrganizationItem':
			return await readProcessMutationField(
				tx,
				process.id,
				participant.assigneeReferencedOrganizationItem,
			)
		case 'referencedPerson':
			return null
	}
}
