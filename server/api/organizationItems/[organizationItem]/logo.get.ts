import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationItem: idSchema,
	}).parseAsync(data))

	await checkPermission('organizationItems.read')

	const path = organizationItemLogoPath(params.organizationItem)
	if(!existsSync(path)) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Logo nicht gefunden',
		})
	}

	setResponseHeader(event, 'Content-Type', 'image/png')
	await send(event, await readFile(path))
})
