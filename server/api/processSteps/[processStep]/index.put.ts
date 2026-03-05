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
		await checkProcessStepPermission(tx, params.processStep)

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
