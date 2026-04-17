import { z } from 'zod'
import { eq } from 'drizzle-orm'
import type { ProcessMutation } from '~~/server/types/expandedProcessMutations'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		processStep: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const step = await database.query.workflowProcessSteps.findFirst({
		where: eq(workflowProcessSteps.id, params.processStep),
		with: {
			process: {
				with: {
					initiatorOrganizationItem: true,
					mutations: {
						with: {
							mutation: true,
						},
						columns: {
							mutation: false,
						},
					},
				},
				columns: {
					initiatorOrganizationItem: false,
				},
			},
			step: true,
		},
		columns: {
			process: false,
			step: false,
		},
	})

	if(!step) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Prozessschritt nicht gefunden',
			data: {
				processStepId: params.processStep,
			},
		})
	}

	if(step.step.assignee !== 'organizationItem' || !step.step.assigneeOrganizationItem) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Prozessschritt ist nicht einem Organisationselement zugeordnet',
			data: {
				processStepId: params.processStep,
			},
		})
	}

	await checkPermission('workflowProcesses.update', { organizationItem: step.step.assigneeOrganizationItem })

	const body = await readValidatedBody(event, async (data) => await z.object({
		session: z.uuid(),
	}).parseAsync(data))

	const session = await database.query.sessions.findFirst({
		where: eq(sessions.id, body.session),
		columns: {
			id: true,
			organizationItem: true,
		},
	})

	if(!session) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Sitzung nicht gefunden',
			data: {
				sessionId: body.session,
			},
		})
	}

	const mutation = step.process.mutations[0]
	if(!mutation || step.process.mutations.length !== 1) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Prozess hat nicht genau eine Mutation',
			data: {
				processId: step.process.id,
				mutationCount: step.process.mutations.length,
			},
		})
	}

	const encodedData = await database.transaction(async (tx) => {
		return await encodeProcessData(
			tx,
			mutation.mutation.table as `${ProcessMutation}s`,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			mutation.data as any,
		)
	})

	const client = useOpenslides()
	await client.connect()

	const openslidesMeetingId = await getOpenslidesMeetingId(client, session.organizationItem, session.id)
	await client.motion.create({
		meeting_id: openslidesMeetingId,
		additional_submitter: formatOrganizationItem(step.process.initiatorOrganizationItem),
		title: 'TITEL',
		text: await encodeProcessMutation(
			mutation.mutation.table.substring(0, mutation.mutation.table.length - 1) as ProcessMutation,
			'html',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			encodedData as any,
		),
	})
})
