import type { EventContext } from '~~/server/types'

import { z } from 'zod'

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
		orderBy: (workflows, { asc }) => [ asc(workflows.code) ],
	})

	const result = workflows.map((workflow) => ({
		...workflow,
		allowedInitiators: workflow.allowedInitiators.map((initiator) => ({
			...initiator,
			person: withDisplayName(initiator.person),
		})),
	}))

	if(query.filter === 'mine') {
		const context = event.context as EventContext
		const personId = context.user?.person?.id ?? null
		const isAdmin = context.user?.roles.some((role) => role.isAdmin) ?? false
		const createPermissions = (context.user?.permissions ?? [])
			.filter((permission) => permission.permission === 'workflowProcesses.create')

		// Both checks mirror the ones the POST endpoint runs, so that the list
		// only offers the workflows that a process may actually be created for.
		const canCreateAsPerson = hasPermission('workflowProcesses.create')
		const canCreateForOrganizationItem = (organizationItem: string) =>
			isAdmin || createPermissions.some((permission) =>
				permission.organizationItem === false ||
				permission.organizationItem === organizationItem,
			)

		return result.filter((workflow) =>
			workflow.allowedInitiators.some((initiator) => {
				// An initiator without a single restriction lets anyone who may
				// create a process start the workflow in their own name.
				const isUnrestricted = Object.entries(initiator)
					.every(([ key, value ]) => key === 'id' || value === null)

				if(canCreateAsPerson && (
					isUnrestricted ||
					(personId !== null && initiator.person?.id === personId) ||
					(context.user?.roles ?? []).some((role) => initiator.role?.id === role.id)
				)) return true

				const itemIds = initiator.organizationItem
					? [ initiator.organizationItem.id ]
					: initiator.organizationType?.items.map((item) => item.id) ?? []
				return itemIds.some(canCreateForOrganizationItem)
			}),
		)
	}

	return result
})
