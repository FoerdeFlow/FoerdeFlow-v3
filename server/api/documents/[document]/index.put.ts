import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		document: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(documents).omit({ id: true, organizationItem: true }).parseAsync(data))

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

	await checkPermission('documents.update', { organizationItem: result.organizationItem })

	await database
		.update(documents)
		.set(body)
		.where(eq(documents.id, params.document))
})
