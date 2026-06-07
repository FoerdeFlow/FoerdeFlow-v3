import z from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		text: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const data = await database.query.texts.findFirst({
		where: (texts, { eq }) => eq(texts.id, params.text),
		with: {
			document: {
				with: {
					type: true,
					authorOrganizationItem: true,
					authorPerson: true,
				},
				columns: {
					id: true,
					organizationItem: true,
					title: true,
				},
			},
		},
		columns: {
			id: true,
			text: true,
		},
	})
	if(!data) {
		throw createError({
			statusCode: 404,
			message: 'Text not found',
		})
	}
	
	const { document, ...text } = data

	await checkPermission('texts.read', { organizationItem: document.organizationItem })

	return {
		...text,
		...document,
		id: text.id,
		documentId: document.id,
		authorType: document.authorPerson ? 'person' as const : 'organizationItem' as const,
	}
})