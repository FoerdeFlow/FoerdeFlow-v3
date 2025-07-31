import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()

	const params = await getValidatedRouterParams(event, z.object({
		organizationItem: idSchema,
	}).parseAsync)

	const body = await readValidatedBody(event, createUpdateSchema(organizationItems).omit({ id: true }).parseAsync)
	for(let parent = body.parent; parent;) {
		if(parent === params.organizationItem) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Zirkuläre Referenz gefunden',
				data: { organizationItemId: params.organizationItem },
			})
		}
		const parentItem = await database.query.organizationItems.findFirst({
			where: eq(organizationItems.id, parent),
		})
		if(!parentItem) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Übergeordnete Organisationseinheit nicht gefunden',
				data: { parentId: parent },
			})
		}
		parent = parentItem.parent
	}

	const result = await database
		.update(organizationItems)
		.set(body)
		.where(eq(organizationItems.id, params.organizationItem))

	if(result.rowCount === 0) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Organisationseinheit nicht gefunden',
			data: {
				organizationItemId: params.organizationItem,
			},
		})
	}
})
