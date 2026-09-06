import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		processDraft: idSchema,
	}).parseAsync(data))

	const draft = await checkProcessDraftPermission(params.processDraft)

	const database = useDatabase()

	await database
		.delete(workflowProcessDrafts)
		.where(eq(workflowProcessDrafts.id, draft.id))

	await removeProcessDraftAttachments(draft.id, draft.data)
})
