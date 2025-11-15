import { stat } from 'node:fs/promises'
import { z } from 'zod'
import { and, asc, eq, isNotNull } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		organizationItem: z.uuid(),
		published: z.enum([ 'yes', 'all' ]).default('yes').optional(),
	}).parseAsync(data))

	await checkPermission('documents.read', { organizationItem: query.organizationItem })

	if(query.published === 'all') {
		await checkPermission('documents.update', { organizationItem: query.organizationItem })
	}

	const database = useDatabase()

	const result = await database.query.documents.findMany({
		where: and(
			eq(documents.organizationItem, query.organizationItem),
			...(query.published === 'yes' ? [ isNotNull(documents.number) ] : []),
		),
		with: {
			type: true,
			authorOrganizationItem: true,
			authorPerson: true,
		},
		columns: {
			organizationItem: false,
			type: false,
			authorOrganizationItem: false,
			authorPerson: false,
		},
		orderBy: [
			asc(documents.period),
			asc(documents.number),
		],
	})

	return await Promise.all(result.map(async (document) => ({
		...document,
		hasContent: await stat(`./data/${document.id}.pdf`).then((it) => it.isFile()).catch(() => false),
	})))
})
