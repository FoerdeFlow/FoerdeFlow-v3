import { readFile } from 'node:fs/promises'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		process: z.uuid(),
		attachment: z.string().regex(/^[a-zA-Z0-9_-]+$/),
	}).parseAsync(data))

	try {
		return await readFile(`./data/${params.process}_${params.attachment}`)
	} catch (error) {
		throw createError({
			statusCode: 404,
			message: 'Anhang nicht gefunden',
		})
	}
})