import type { EventContext } from '~~/server/types'

import { eq } from 'drizzle-orm'
import { unlink } from 'node:fs/promises'
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
			message: 'Cannot delete text of a document that has already been numbered',
		})
	}

	await checkPermission('texts.read', { organizationItem: data.document.organizationItem })

	if(data.document.authorOrganizationItem) {
		await checkPermission(
			'texts.delete',
			{ organizationItem: data.document.authorOrganizationItem },
			{ exactScopeMatch: true },
		)
	} else if(data.document.authorPerson === (event.context as EventContext).user?.person?.id) {
		await checkPermission('texts.delete')
	} else {
		throw createError({
			statusCode: 403,
			message: 'You do not have permission to delete this text',
		})
	}

	await database.transaction(async (tx) => {
		await tx
			.delete(texts)
			.where(eq(texts.id, params.text))

		await tx
			.delete(documents)
			.where(eq(documents.id, data.document.id))
	})

	await unlink(`./data/${data.document.id}.pdf`).catch(() => { /* ignore */ })
})
