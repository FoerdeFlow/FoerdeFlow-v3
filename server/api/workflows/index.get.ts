import { z } from 'zod'
import type { EventContext } from '~~/server/types'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.strictObject({
		filter: z.enum([ 'mine' ]).optional(),
	}).parseAsync(data))

	if(query.filter !== 'mine') {
		await checkPermission('workflows.read')
	}

	const database = useDatabase()

	const workflows = await database.query.workflows.findMany({
		with: {
			allowedInitiators: {
				with: {
					person: true,
					role: true,
					organizationType: {
						with: {
							items: true,
						},
					},
					organizationItem: true,
				},
				columns: {
					workflow: false,
					person: false,
					role: false,
					organizationType: false,
					organizationItem: false,
				},
			},
		},
	})

	if(query.filter === 'mine') {
		const context = event.context as EventContext
		return workflows.filter((workflow) =>
			workflow.allowedInitiators.some((initiator) => (
				initiator.person === null ||
				initiator.person.id === context.user?.person?.id
			) && (
				initiator.role === null ||
				context.user?.roles
					.map((role) => role.id)
					.includes(initiator.role.id)
			) && (
				initiator.organizationType === null ||
				context.user?.permissions
					.filter((permission) =>
						permission.permission === 'workflowProcesses.create' &&
						(
							permission.organizationItem === false ||
							initiator.organizationType?.items
								.map((item) => item.id)
								.includes(permission.organizationItem ?? '')
						),
					)
			) && (
				initiator.organizationItem === null ||
				context.user?.permissions
					.filter((permission) =>
						permission.permission === 'workflowProcesses.create' &&
						permission.organizationItem === initiator.organizationItem)
			)),
		)
	}

	return workflows
})
