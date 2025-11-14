import { unlink } from 'node:fs/promises'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		document: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const document = await database.query.documents.findFirst({
		where: eq(documents.id, params.document),
		columns: {
			organizationItem: true,
		},
	})

	if(!document) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Dokument nicht gefunden',
			data: {
				documentId: params.document,
			},
		})
	}

	await checkPermission('documents.update', { organizationItem: document.organizationItem })

	try {
		await unlink(`./data/${params.document}.pdf`)
	} catch(_error) {
		throw createError({
			statusCode: 404,
			statusMessage: 'PDF nicht gefunden',
		})
	}
})
