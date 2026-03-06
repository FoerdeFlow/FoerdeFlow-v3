import { eq } from 'drizzle-orm'
import { EventContext } from '../types'

export async function checkProcessStepPermission(
	tx: ReturnType<typeof useDatabase>,
	workflowProcessStepId: string,
	requireEditable: boolean = true,
) {
	const event = useEvent()
	if ((event.context as EventContext).user?.roles.some((role) => role.isAdmin)) {
		return
	}

	const [result = null] = await tx
		.select({
			process: workflowProcessSteps.process,
			step: workflowProcessSteps.step,
		})
		.from(workflowProcessSteps)
		.where(eq(workflowProcessSteps.id, workflowProcessStepId))
	if (!result) {
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
	if (!process) {
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
	if (!step) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Workflow-Schritt nicht gefunden',
			data: {
				stepId: result.step,
			},
		})
	}

	if (step.type === 'job') {
		if (!(event.context as EventContext).user?.roles.some((role) => role.isAdmin)) {
			throw createError({
				statusCode: 403,
				statusMessage: 'Forbidden',
				data: 'User is not allowed to update job steps',
			})
		}
	} else switch (step.assignee) {
		case 'initiator':
			switch (process.initiatorType) {
				case 'person':
					if (
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
		case 'referencedPerson':
			const [referencedPersonTable, ...referencedPersonSteps] = step.assigneeReferencedPerson?.split('.') || []
			if (!referencedPersonTable || referencedPersonSteps.length <= 0) {
				throw createError({
					statusCode: 403,
					statusMessage: 'Forbidden',
					data: 'Invalid referenced person assignment',
				})
			}

			const mutation = await tx.query.workflowProcessMutations.findFirst({
				where: (tbl, { and, eq, exists }) => and(
					eq(tbl.process, result.process),
					exists(
						tx.select()
							.from(workflowMutations)
							.where(and(
								eq(workflowMutations.id, tbl.mutation),
								eq(workflowMutations.table, referencedPersonTable),
							)),
					)
				),
				columns: {
					data: true,
				},
			})
			if (!mutation) {
				throw createError({
					statusCode: 403,
					statusMessage: 'Forbidden',
					data: 'Referenced person mutation not found',
				})
			}

			let referencedPersonData: Record<string, unknown> | undefined = mutation.data as Record<string, unknown>
			for (const step of referencedPersonSteps) {
				if (typeof referencedPersonData === 'object' && referencedPersonData !== null) {
					referencedPersonData = referencedPersonData[step] as Record<string, unknown> | undefined
				} else {
					referencedPersonData = undefined
					break
				}
			}

			const referencedPersonId = typeof referencedPersonData === 'string' ? referencedPersonData : undefined
			if (referencedPersonId !== (event.context as EventContext).user?.person?.id) {
				throw createError({
					statusCode: 403,
					statusMessage: 'Forbidden',
					data: 'User is not the referenced person assigned to the step',
				})
			}
			break
		case 'organizationItem':
			try {
				await checkPermission(
					'workflowProcesses.update',
					{ organizationItem: step.assigneeOrganizationItem ?? '' },
					{ exactScopeMatch: true },
				)
			} catch (error) {
				if (
					requireEditable ||
					!(event.context as EventContext).user?.memberships?.some((membership) =>
						membership.organizationItem.id === step.assigneeOrganizationItem
					)
				) {
					throw error
				}
			}
			break
	}

	if (requireEditable && process.status === 'completed') {
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