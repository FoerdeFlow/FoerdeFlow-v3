import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('organizationItemGroups.delete')

	const database = useDatabase()
	const client = useOpenslides()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationItemGroup: idSchema,
	}).parseAsync(data))

	await database.transaction(async (tx) => {
		const [ result = null ] = await tx
			.delete(organizationItemGroups)
			.where(eq(organizationItemGroups.id, params.organizationItemGroup))
			.returning({ organizationItem: organizationItemGroups.organizationItem })

		if(!result) {
			throw createError({
				statusCode: 404,
				statusMessage: 'OE-Gruppe nicht gefunden',
				data: {
					organizationItemGroupId: params.organizationItemGroup,
				},
			})
		}

		await client.connect()
		const templateId = await getOpenslidesTemplateMeetingId(client, result.organizationItem)
		const { id: groupId } = await client.presenters.search_for_id_by_external_id({
			collection: 'group',
			external_id: params.organizationItemGroup,
			context_id: templateId,
		})
		await client.group.delete({
			id: groupId,
		})
	})
})
