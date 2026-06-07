import { writeFile } from 'node:fs/promises'
import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'
import { EventContext } from '~~/server/types'

export default defineEventHandler(async (event) => {
	const { authorType, ...body } = await readValidatedBody(event, async (data) => await z.object({
		...createInsertSchema(texts).omit({
			id: true,
			document: true,
		}).shape,
		...createInsertSchema(documents).omit({
			id: true,
			period: true,
			number: true,
		}).shape,
		authorType: z.enum(['person', 'organizationItem']),
	}).parseAsync(data))

	if(authorType === 'person') {
		if(body.authorOrganizationItem) {
			throw createError({
				statusCode: 400,
				message: 'authorOrganizationItem must not be provided when authorType is person',
			})
		}
		await checkPermission('texts.create')
	} else {
		if(!body.authorOrganizationItem) {
			throw createError({
				statusCode: 400,
				message: 'authorOrganizationItem is required when authorType is organizationItem',
			})
		}
		await checkPermission(
			'texts.create',
			{ organizationItem: body.authorOrganizationItem },
			{ exactScopeMatch: true },
		)
	}

	const database = useDatabase()

	const result = await database.transaction(async (tx) => {
		const latestDocument = await tx.query.documents.findFirst({
			orderBy: (tbl, { desc }) => [ desc(tbl.period) ],
			columns: {
				period: true,
			},
		})
		if(!latestDocument) {
			throw createError({
				statusCode: 500,
				statusMessage: 'No documents found to determine period for new document',
			})
		}

		const [ document ] = await tx
			.insert(documents)
			.values({
				organizationItem: body.organizationItem,
				type: body.type,
				title: body.title,
				...(authorType === 'person' ? {
					authorPerson: (event.context as EventContext).user?.person?.id,
				} : {
					authorOrganizationItem: body.authorOrganizationItem,
				}),
				period: latestDocument.period,
			})
			.returning({ id: documents.id })
		if(!document) {
			throw createError({
				statusCode: 500,
				message: 'Failed to create document',
			})
		}

		const [ text ] = await tx
			.insert(texts)
			.values({
				document: document.id,
				text: body.text,
			})
			.returning({ id: texts.id })
		if(!text) {
			throw createError({
				statusCode: 500,
				message: 'Failed to create text',
			})
		}

		return { document, text }
	})

	const doc = textCreatePdf(body.title, body.text)
	const pdf = Buffer.from(doc.output('arraybuffer'))
	await writeFile(`./data/${result.document.id}.pdf`, pdf)

	return result.text
})
