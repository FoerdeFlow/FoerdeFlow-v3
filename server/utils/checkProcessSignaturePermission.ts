import { eq } from 'drizzle-orm'

import type { EventContext } from '../types'

/**
 * Checks whether the current user may confirm the receipt of a process signature.
 *
 * Unlike {@link checkProcessStepPermission} this deliberately does not reject
 * completed processes: the paper trail is decoupled from the process status, so a
 * signature has to stay confirmable after the process itself has been completed.
 *
 * @param tx - The database connection or transaction to use
 * @param workflowProcessSignatureId - The process signature to check
 */
export async function checkProcessSignaturePermission(
	tx: ReturnType<typeof useDatabase>,
	workflowProcessSignatureId: string,
) {
	const event = useEvent()
	if((event.context as EventContext).user?.roles.some((role) => role.isAdmin)) {
		return
	}

	const processSignature = await tx.query.workflowProcessSignatures.findFirst({
		where: eq(workflowProcessSignatures.id, workflowProcessSignatureId),
		with: {
			signature: {
				columns: {
					assignee: true,
					assigneeReferencedPerson: true,
					assigneeOrganizationItem: true,
				},
			},
		},
		columns: {
			process: true,
		},
	})
	if(!processSignature) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Unterschrift nicht gefunden',
			data: {
				workflowProcessSignatureId,
			},
		})
	}

	const process = await tx.query.workflowProcesses.findFirst({
		where: eq(workflowProcesses.id, processSignature.process),
		columns: {
			initiatorType: true,
			initiatorPerson: true,
			initiatorOrganizationItem: true,
		},
	})
	if(!process) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Prozess nicht gefunden',
			data: {
				processId: processSignature.process,
			},
		})
	}

	await checkParticipantPermission(
		tx,
		{
			id: processSignature.process,
			...process,
		},
		processSignature.signature,
	)
}
