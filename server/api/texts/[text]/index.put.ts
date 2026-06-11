import type { EventContext } from '~~/server/types'

import { eq } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import { writeFile } from 'node:fs/promises'
import z from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		text: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) => await z.object({
		...createInsertSchema(texts).omit({
			id: true,
			document: true,
		}).shape,
		...createInsertSchema(documents).omit({
			id: true,
			organizationItem: true,
			period: true,
			number: true,
			authorPerson: true,
			authorOrganizationItem: true,
		}).shape,
	}).parseAsync(data))

	const database = useDatabase()

	const data = await database.query.texts.findFirst({
		where: (texts, { eq }) => eq(texts.id, params.text),
		with: {
			document: {
				columns: {
					id: true,
					organizationItem: true,
					number: true,
					authorPerson: true,
					authorOrganizationItem: true,
				},
			},
		},
		columns: {
			id: true,
		},
	})
	if(!data) {
		throw createError({
			statusCode: 404,
			message: 'Text not found',
		})
	}
	if(data.document.number) {
		throw createError({
			statusCode: 400,
			message: 'Cannot update text of a document that has already been numbered',
		})
	}

	await checkPermission('texts.read', { organizationItem: data.document.organizationItem })

	if(data.document.authorOrganizationItem) {
		await checkPermission(
			'texts.update',
			{ organizationItem: data.document.authorOrganizationItem },
			{ exactScopeMatch: true },
		)
	} else if(data.document.authorPerson === (event.context as EventContext).user?.person?.id) {
		await checkPermission('texts.update')
	} else {
		throw createError({
			statusCode: 403,
			message: 'You do not have permission to update this text',
		})
	}

	await database.transaction(async (tx) => {
		await tx
			.update(documents)
			.set({
				title: body.title,
				type: body.type,
			})
			.where(eq(documents.id, data.document.id))
			.returning({ id: documents.id })

		await tx
			.update(texts)
			.set({
				text: body.text,
			})
			.where(eq(texts.id, params.text))
			.returning({ id: texts.id })
	})

	const doc = textCreatePdf(body.title, body.text)
	const pdf = Buffer.from(doc.output('arraybuffer'))
	await writeFile(`./data/${data.document.id}.pdf`, pdf)
})
