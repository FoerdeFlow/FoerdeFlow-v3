import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (_event) => {
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

	return (await Promise.all(processes.map(async (process) => {
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
})
