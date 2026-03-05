import { eq } from 'drizzle-orm'
import { access } from 'node:fs/promises'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		process: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	return await database.transaction(async (tx) => {
		const processItem = await tx.query.workflowProcesses.findFirst({
			where: eq(workflowProcesses.id, params.process),
			with: {
				workflow: true,
				initiatorPerson: true,
				initiatorOrganizationItem: true,
				steps: {
					with: {
						step: {
							with: {
								assigneeOrganizationItem: true,
							},
							columns: {
								assigneeOrganizationItem: false,
							},
						},
					},
					columns: {
						process: false,
					},
					orderBy: (step, { asc, sql }) => asc(
						sql<number>`(
							SELECT stage
							FROM ${workflowSteps} ff3_ws
							WHERE ff3_ws.id = ${step.step}
						)`,
					),
				},
				mutations: {
					with: {
						mutation: true,
					},
					columns: {
						mutation: false,
						process: false,
					},
				},
			},
			columns: {
				workflow: false,
				initiatorPerson: false,
				initiatorOrganizationItem: false,
			},
		})

		if (!processItem) {
			throw createError({
				statusCode: 404,
				message: 'Prozess nicht gefunden',
			})
		}

		processItem.steps = await Promise.all(processItem.steps.map(async (processStep) => ({
			...processStep,
			editable: await checkProcessStepPermission(tx, processStep.id).then(() => true).catch(() => false),
		})))

		return {
			...processItem,
			mutations: await Promise.all(processItem.mutations.map(async (mutation) => ({
				...mutation,
				// @ts-expect-error | Table is not typed properly
				data: await encodeProcessData(tx, mutation.mutation.table, mutation.data),
				attachments: (await Promise.all(processSchemas[mutation.mutation.table as keyof typeof processSchemas]?.attachments.map(async (attachment) => ({
					name: attachment,
					present: await access(`./data/${params.process}_${mutation.mutation.id}_photo`).then(() => true).catch(() => false),
				})))).filter(attachment => attachment.present).map(attachment => attachment.name) as string[],
			}))),
		}
	})
})
