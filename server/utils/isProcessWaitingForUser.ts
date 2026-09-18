import type { EventContext } from '../types'

/**
 * Checks whether a process currently waits for an action of the signed-in user.
 *
 * A process waits for the user while it is still pending and the user is
 * addressed by its current step. That is deliberately the same condition that
 * makes `mail:reminder` send a reminder, so the overview cannot drift apart from
 * the reminder mails.
 *
 * Being addressed is not the same as being allowed to act: administrators hold
 * every permission without being the addressee of any step, which is why this
 * resolves the assignees instead of calling {@link checkParticipantPermission}.
 * Job steps are excluded because they are processed automatically.
 *
 * @param process - The process together with its current step
 * @returns Whether the user has to act on the process
 */
export async function isProcessWaitingForUser(process: {
	id: string
	status: 'pending' | 'completed' | 'failed'
	initiatorType: 'person' | 'organizationItem'
	initiatorPerson: { id: string } | null
	initiatorOrganizationItem: { id: string } | null
	currentStep: {
		step: {
			type: 'comment' | 'approval' | 'task' | 'job'
			assignee: 'initiator' | 'referencedPerson' | 'organizationItem'
			assigneeReferencedPerson: string | null
			assigneeOrganizationItem: { id: string } | null
		}
	} | null
}) {
	const person = (useEvent().context as EventContext).user?.person?.id
	if(!person) return false
	if(process.status !== 'pending') return false
	if(!process.currentStep || process.currentStep.step.type === 'job') return false

	const assignees = await getProcessAssignees({
		assignee: process.currentStep.step.assignee,
		assigneeReferencedPerson: process.currentStep.step.assigneeReferencedPerson,
		assigneeOrganizationItem: process.currentStep.step.assigneeOrganizationItem?.id ?? null,
		processId: process.id,
		initiatorType: process.initiatorType,
		initiatorPerson: process.initiatorPerson?.id ?? null,
		initiatorOrganizationItem: process.initiatorOrganizationItem?.id ?? null,
	})

	return assignees.some((assignee) => assignee.id === person)
}
