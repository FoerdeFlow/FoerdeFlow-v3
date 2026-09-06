import { eq } from 'drizzle-orm'

import type { EventContext } from '../types'

/**
 * Checks whether the current user may read and change a draft of a process.
 *
 * Drafts belong to the person who saved them. A draft that is written for an
 * organization item is additionally shared with its members, so that they can
 * hand an unfinished request over to each other.
 *
 * @param draftId - The draft to check
 * @returns The draft, so that the caller does not have to read it again
 */
export async function checkProcessDraftPermission(draftId: string) {
	const event = useEvent()
	const database = useDatabase()
	const context = event.context as EventContext

	const draft = await database.query.workflowProcessDrafts.findFirst({
		where: eq(workflowProcessDrafts.id, draftId),
	})
	if(!draft) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Entwurf nicht gefunden',
			data: {
				draftId,
			},
		})
	}

	const allowed = draft.owner === context.user?.person?.id ||
		(
			draft.initiatorType === 'organizationItem' &&
			(context.user?.memberships ?? []).some((membership) =>
				membership.organizationItem.id === draft.initiatorOrganizationItem,
			)
		)
	if(!allowed) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Keine Berechtigung für diesen Entwurf',
			data: {
				draftId,
			},
		})
	}

	return draft
}
