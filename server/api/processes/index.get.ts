import { sql } from 'drizzle-orm'
import z from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.strictObject({
		page: z.coerce.number().int().min(0).optional(),
		limit: z.coerce.number().int().min(1).max(10).default(10),
		filter: z.enum([ 'waiting' ]).optional(),
	}).parseAsync(data))

	const database = useDatabase()

	const processes = await database.query.workflowProcesses.findMany({
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
							name: true,
							type: true,
							assignee: true,
							assigneeReferencedPerson: true,
						},
					},
				},
				columns: {
					status: true,
					modifiedAt: true,
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
				columns: {},
				extras: {
					title: sql<string>`(
						${workflowProcessMutations.data} ->> 'title'
					)`.as('title'),
				},
			},
		},
		columns: {
			workflow: false,
			initiatorPerson: false,
			initiatorOrganizationItem: false,
		},
		orderBy: (process, { asc, desc }) => [
			asc(process.status),
			desc(process.createdAt),
		],
	})

	const items = (await Promise.all(processes.map(async (process) => {
		try {
			await checkProcessPermission(process.id)
			const { steps, ...processData } = process
			const currentStepIndex = steps.findIndex((step) => step.status === 'pending')

			return {
				...processData,
				currentStep: steps[currentStepIndex] ?? null,
				previousStep: currentStepIndex > 0 ? steps[currentStepIndex - 1] ?? null : null,
			}
		} catch{
			return null
		}
	}))).filter((process): process is NonNullable<typeof process> => process !== null)

	const filtered = query.filter === 'waiting'
		? (await Promise.all(items.map(async (item) =>
			await isProcessWaitingForUser(item) ? item : null,
		))).filter((item): item is NonNullable<typeof item> => item !== null)
		: items

	const offset = (query.page ?? 0) * query.limit

	return {
		count: filtered.length,
		items: filtered.slice(offset, offset + query.limit),
	}
})
