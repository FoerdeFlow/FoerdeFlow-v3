import { eq } from 'drizzle-orm'

import type { EventContext } from '../types'

export async function checkProcessStepPermission(
	tx: ReturnType<typeof useDatabase>,
	workflowProcessStepId: string,
	requireEditable = true,
) {
	const event = useEvent()
	if((event.context as EventContext).user?.roles.some((role) => role.isAdmin)) {
		return
	}

	const [ result = null ] = await tx
		.select({
			process: workflowProcessSteps.process,
			step: workflowProcessSteps.step,
		})
		.from(workflowProcessSteps)
		.where(eq(workflowProcessSteps.id, workflowProcessStepId))
	if(!result) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Prozessschritt nicht gefunden',
			data: {
				workflowProcessStepId,
			},
		})
	}

	const process = await tx.query.workflowProcesses.findFirst({
		where: eq(workflowProcesses.id, result.process),
		columns: {
			status: true,
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
				processId: result.process,
			},
		})
	}

	const step = await tx.query.workflowSteps.findFirst({
		where: eq(workflowSteps.id, result.step),
		columns: {
			assignee: true,
			assigneeReferencedPerson: true,
			assigneeOrganizationItem: true,
			type: true,
			code: true,
		},
	})
	if(!step) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Workflow-Schritt nicht gefunden',
			data: {
				stepId: result.step,
			},
		})
	}

	if(step.type === 'job') {
		if(!(event.context as EventContext).user?.roles.some((role) => role.isAdmin)) {
			throw createError({
				statusCode: 403,
				statusMessage: 'Forbidden',
				data: 'User is not allowed to update job steps',
			})
		}
	} else {
		await checkParticipantPermission(
			tx,
			{
				id: result.process,
				...process,
			},
			step,
			{ allowMembershipFallback: !requireEditable },
		)
	}

	if(requireEditable && process.status === 'completed') {
		throw createError({
			statusCode: 400,
			statusMessage: 'Prozess kann nicht mehr bearbeitet werden',
			data: {
				processId: result.process,
				currentStatus: process.status,
			},
		})
	}
}
