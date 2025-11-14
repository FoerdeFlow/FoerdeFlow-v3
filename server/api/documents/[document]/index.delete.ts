import { unlink } from 'node:fs/promises'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		document: idSchema,
	}).parseAsync(data))

	const result = await database.query.documents.findFirst({
		where: eq(documents.id, params.document),
		columns: { organizationItem: true },
	})

	if(!result) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Vorlage nicht gefunden',
			data: {
				documentId: params.document,
			},
		})
	}

	await checkPermission('documents.delete', { organizationItem: result.organizationItem })

	await unlink(`./data/${params.document}.pdf`)

	await database
		.delete(documents)
		.where(eq(documents.id, params.document))
})
