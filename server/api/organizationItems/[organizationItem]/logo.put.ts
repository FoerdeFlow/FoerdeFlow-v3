import { eq } from 'drizzle-orm'
import { writeFile } from 'node:fs/promises'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationItem: idSchema,
	}).parseAsync(data))

	await checkPermission('organizationItems.update')

	const body = await readRawBody(event, false)
	if(!body || body.length === 0) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			message: 'Das Logo ist leer',
		})
	}
	if(body.length > organizationItemLogoMaxSize) {
		throw createError({
			statusCode: 413,
			statusMessage: 'Payload Too Large',
			message: 'Das Logo darf höchstens 2 MB groß sein',
		})
	}
	if(!isPng(body)) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			message: 'Das Logo muss eine PNG-Datei sein',
		})
	}

	const database = useDatabase()

	const organizationItem = await database.query.organizationItems.findFirst({
		where: eq(organizationItems.id, params.organizationItem),
		columns: {
			id: true,
		},
	})

	if(!organizationItem) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Organisationseinheit nicht gefunden',
			data: {
				organizationItemId: params.organizationItem,
			},
		})
	}

	await writeFile(organizationItemLogoPath(params.organizationItem), body)
})
