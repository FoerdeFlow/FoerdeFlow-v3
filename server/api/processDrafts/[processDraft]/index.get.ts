import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		processDraft: idSchema,
	}).parseAsync(data))

	return await checkProcessDraftPermission(params.processDraft)
})
