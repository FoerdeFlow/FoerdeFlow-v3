import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		processDraft: idSchema,
	}).parseAsync(data))

	const draft = await checkProcessDraftPermission(params.processDraft)

	const { body, attachments } = await readProcessDraftBody(event)
	await checkProcessDraftInitiatorPermission(body)

	if(body.workflow !== draft.workflow) {
		throw createError({
			statusCode: 400,
			message: 'Der Workflow eines Entwurfs kann nicht gewechselt werden',
		})
	}

	const database = useDatabase()

	await database
		.update(workflowProcessDrafts)
		.set({
			initiatorType: body.initiatorType,
			initiatorOrganizationItem: body.initiatorOrganizationItem,
			data: body.data,
			modifiedAt: new Date(),
		})
		.where(eq(workflowProcessDrafts.id, draft.id))

	await writeProcessDraftAttachments(draft.id, draft.data, attachments)

	return { id: draft.id }
})
