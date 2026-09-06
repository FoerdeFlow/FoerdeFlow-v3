import type { EventContext } from '~~/server/types'

import { and, eq, inArray, or } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		workflow: idSchema.optional(),
	}).parseAsync(data))

	const context = event.context as EventContext
	const person = context.user?.person?.id
	if(!person) return []

	const organizationItemIds = (context.user?.memberships ?? [])
		.map((membership) => membership.organizationItem.id)

	const database = useDatabase()

	const drafts = await database.query.workflowProcessDrafts.findMany({
		where: and(
			or(
				eq(workflowProcessDrafts.owner, person),
				organizationItemIds.length > 0
					? and(
						eq(workflowProcessDrafts.initiatorType, 'organizationItem'),
						inArray(
							workflowProcessDrafts.initiatorOrganizationItem,
							organizationItemIds,
						),
					)
					: undefined,
			),
			query.workflow
				? eq(workflowProcessDrafts.workflow, query.workflow)
				: undefined,
		),
		with: {
			workflow: true,
			initiatorOrganizationItem: true,
		},
		columns: {
			workflow: false,
			initiatorOrganizationItem: false,
		},
		orderBy: (draft, { desc }) => desc(draft.modifiedAt),
	})

	return drafts.map(({ data, ...draft }) => ({
		...draft,
		title: processDraftTitle(data),
	}))
})
