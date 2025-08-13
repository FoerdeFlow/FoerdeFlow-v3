import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()
	const client = useOpenslides()

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

	await database.transaction(async (tx) => {
		const result = await tx.update(organizationItems).set(body).where(eq(organizationItems.id, params.organizationItem))
		if(result.rowCount === 0) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Organisationseinheit nicht gefunden',
				data: {
					organizationItemId: params.organizationItem,
				},
			})
		}

		await client.connect()
		const { id } = await client.presenters.search_for_id_by_external_id({
			collection: 'committee',
			external_id: params.organizationItem,
			context_id: 1,
		})
		let parentId
		if(body.parent) {
			({ id: parentId } = await client.presenters.search_for_id_by_external_id({
				collection: 'committee',
				external_id: body.parent,
				context_id: 1,
			}))
		}
		await client.committee.update({
			id: id,
			name: `${body.name} (${body.code})`,
			...(parentId ? { parent_id: parentId } : {}),
		})
	})
})
