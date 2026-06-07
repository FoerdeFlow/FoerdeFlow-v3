import z from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: z.uuid(),
	}).parseAsync(data))

	await checkPermission('texts.read', { organizationItem: query.organizationItem })

	const database = useDatabase()

	const texts = await database.query.texts.findMany({
		where: (texts, { exists, and, eq }) => exists(
			database.select()
				.from(documents)
				.where(and(
					eq(documents.id, texts.document),
					eq(documents.organizationItem, query.organizationItem),
				)),
		),
		with: {
			document: {
				with: {
					type: true,
					authorOrganizationItem: true,
					authorPerson: true,
				},
				columns: {
					id: true,
					title: true,
				},
			},
		},
		columns: {
			id: true,
		},
	})

	return texts.map(({ document, ...text }) => ({
		...text,
		...document,
		id: text.id,
		documentId: document.id,
		authorType: document.authorPerson ? 'person' : 'organizationItem',
	}))
})