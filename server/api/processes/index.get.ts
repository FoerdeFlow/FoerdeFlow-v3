import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (_event) => {
	const database = useDatabase()

	const processes = await database.query.workflowProcesses.findMany({
		with: {
			workflow: true,
			initiatorPerson: true,
			initiatorOrganizationItem: true,
			steps: {
				where: (step) => eq(step.status, 'pending'),
				with: {
					step: {
						with: {
							assigneeOrganizationItem: true,
						},
						columns: {
							assignee: true,
						},
					},
				},
				columns: {
					status: true,
				},
				orderBy: (step, { asc, sql }) => asc(
					sql<number>`(
						SELECT stage
						FROM ${workflowSteps} ff3_ws
						WHERE ff3_ws.id = ${step.step}
					)`,
				),
				limit: 1,
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
	})

	return processes
})
