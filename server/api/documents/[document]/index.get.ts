import { stat } from 'node:fs/promises'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		document: idSchema,
	}).parseAsync(data))

	const document = await database.query.documents.findFirst({
		where: eq(documents.id, params.document),
		with: {
			organizationItem: true,
			type: true,
			authorOrganizationItem: true,
			authorPerson: true,
		},
		columns: {
			id: false,
			organizationItem: false,
			type: false,
			authorOrganizationItem: false,
			authorPerson: false,
		},
	})

	if(!document) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Vorlage nicht gefunden',
			data: {
				documentId: params.document,
			},
		})
	}

	await checkPermission('documents.read', { organizationItem: document.organizationItem.id })

	return {
		...document,
		hasContent: await stat(`./data/${params.document}.pdf`).then((it) => it.isFile()).catch(() => false),
	}
})
