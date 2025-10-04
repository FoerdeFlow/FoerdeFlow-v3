import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationItemGroup: idSchema,
	}).parseAsync(data))

	const database = useDatabase()

	const organizationItemGroup = await database.query.organizationItemGroups.findFirst({
		where: eq(organizationItemGroups.id, params.organizationItemGroup),
		columns: {
			organizationItem: true,
		},
	})

	await checkPermission('organizationItemGroups.delete', {
		organizationItem: organizationItemGroup?.organizationItem,
	})

	const client = useOpenslides()

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
