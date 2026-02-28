import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { EventContext } from '~~/server/types'

export default defineEventHandler(async (event) => {
	const runtimeConfig = useRuntimeConfig()
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
		const [result = null] = await tx
			.update(workflowProcessSteps)
			.set(body)
			.where(eq(workflowProcessSteps.id, params.processStep))
			.returning({
				process: workflowProcessSteps.process,
				step: workflowProcessSteps.step,
			})

		if (!result) {
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
				await checkPermission(
					'workflowProcesses.update',
					{ organizationItem: step.assigneeOrganizationItem ?? '' },
					{ exactScopeMatch: true },
				)
				break
		}

		if (process.status === 'completed') {
			throw createError({
				statusCode: 400,
				statusMessage: 'Prozess kann nicht mehr bearbeitet werden',
				data: {
					processId: result.process,
					currentStatus: process.status,
				},
			})
		}

		if (step.type === 'job' && body.status === 'completed') {
			await executeProcessJob(step.code, tx, result.process)
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

		if (status === 'completed') {
			await applyProcessMutations(tx, result.process)
		}
	})

	const currentStep = await database.query.workflowProcessSteps.findFirst({
		where: eq(workflowProcessSteps.id, params.processStep),
		columns: {
			process: true,
		},
	})
	const steps = await database.query.workflowProcessSteps.findMany({
		where: eq(workflowProcessSteps.process, currentStep?.process ?? ''),
		with: {
			step: true,
		},
		orderBy: (tbl, { asc }) => asc(tbl.step),
	})
	const nextStep = steps.filter((s) => s.status === 'pending')[0]
	if (nextStep && nextStep.step.type === 'job') {
		await $fetch(`/api/processSteps/${nextStep.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'x-foerdeflow-api-key': runtimeConfig.apiKey,
			},
			body: JSON.stringify({
				status: 'completed',
			}),
		})
	}
})
