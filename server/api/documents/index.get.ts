import { stat } from 'node:fs/promises'
import { inArray } from 'drizzle-orm'
import type { EventContext } from '~~/server/types'

export default defineEventHandler(async (event) => {
	const context = event.context as EventContext

	const allowedOrganizationItems = context.user?.permissions
		.filter((item) => item.permission === 'documents.read')
		.map((item) => item.organizationItem)

	if(!allowedOrganizationItems || allowedOrganizationItems.length === 0) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Forbidden',
			data: 'User does not have permission to read documents',
		})
	}

	const database = useDatabase()

	const result = await database.query.documents.findMany({
		...(allowedOrganizationItems.some((item) => item === null || item === false)
			? {}
			: { where: inArray(documents.organizationItem, allowedOrganizationItems as string[]) }),
		with: {
			organizationItem: true,
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
	})

	return await Promise.all(result.map(async (document) => ({
		...document,
		hasContent: await stat(`./data/${document.id}.pdf`).then((it) => it.isFile()).catch(() => false),
	})))
})
