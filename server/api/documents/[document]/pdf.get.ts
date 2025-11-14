import { readFile } from 'node:fs/promises'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		document: z.uuid(),
	}).parseAsync(data))

	const database = useDatabase()

	const document = await database.query.documents.findFirst({
		where: eq(documents.id, params.document),
		with: {
			organizationItem: true,
		},
		columns: {
			period: true,
			number: true,
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

	await checkPermission('documents.read', { organizationItem: document.organizationItem.id })

	const filename = `Vorlage_${document.organizationItem.code}_` +
		`${formatDocumentNumber(document.period, document.number)}.pdf`
	setResponseHeader(event, 'Content-Disposition', `inline; filename="${filename}"`)
	await send(event, await readFile(`./data/${params.document}.pdf`))
})
