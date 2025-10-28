import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { EventContext } from '~~/server/types'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		processStep: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(workflowProcessSteps).omit({
			id: true,
			process: true,
			step: true,
		}).parseAsync(data),
	)

	await database.transaction(async (tx) => {
		const [ result = null ] = await tx
			.update(workflowProcessSteps)
			.set(body)
			.where(eq(workflowProcessSteps.id, params.processStep))
			.returning({
				process: workflowProcessSteps.process,
				step: workflowProcessSteps.step,
			})

		if(!result) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Prozessschritt nicht gefunden',
				data: {
					processStepId: params.processStep,
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
				assigneeOrganizationItem: true,
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

		switch(step.assignee) {
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
			case 'organizationItem':
				await checkPermission(
					'workflowProcesses.update',
					{ organizationItem: step.assigneeOrganizationItem ?? '' },
					{ exactScopeMatch: true },
				)
				break
		}

		if(process.status === 'completed') {
			throw createError({
				statusCode: 400,
				statusMessage: 'Prozess kann nicht mehr bearbeitet werden',
				data: {
					processId: result.process,
					currentStatus: process.status,
				},
			})
		}

		const steps = await tx.query.workflowProcessSteps.findMany({
			where: eq(workflowProcessSteps.process, result.process),
			columns: {
				status: true,
			},
		})

		const allCompleted = steps.every((step) => step.status === 'completed')
		const anyFailed = steps.some((step) => step.status === 'failed')
		const status = allCompleted ? 'completed' : anyFailed ? 'failed' : 'pending'

		await tx
			.update(workflowProcesses)
			.set({ status })
			.where(eq(workflowProcesses.id, result.process))

		if(status === 'completed') {
			await applyProcessMutations(tx, result.process)
		}
	})
})
