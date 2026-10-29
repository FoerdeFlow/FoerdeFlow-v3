import { unlink } from 'node:fs/promises'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationItem: idSchema,
	}).parseAsync(data))

	await checkPermission('organizationItems.update')

	try {
		await unlink(organizationItemLogoPath(params.organizationItem))
	} catch(_error) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Logo nicht gefunden',
		})
	}
})
