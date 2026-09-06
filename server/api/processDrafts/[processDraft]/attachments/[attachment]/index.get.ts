import { readFile } from 'node:fs/promises'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		processDraft: idSchema,
		attachment: z.string().regex(/^[a-zA-Z0-9_-]+$/),
	}).parseAsync(data))

	await checkProcessDraftPermission(params.processDraft)

	try {
		return await readFile(processDraftAttachmentPath(params.processDraft, params.attachment))
	} catch(_error) {
		throw createError({
			statusCode: 404,
			message: 'Anhang nicht gefunden',
		})
	}
})
