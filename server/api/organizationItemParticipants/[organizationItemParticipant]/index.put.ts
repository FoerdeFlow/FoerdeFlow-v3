import { createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()
	const client = useOpenslides()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationItemParticipant: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) =>
		await createUpdateSchema(organizationItemParticipants).omit({ id: true }).parseAsync(data))

	await database.transaction(async (tx) => {
		const [ result ] = await tx
			.update(organizationItemParticipants)
			.set(body)
			.where(eq(organizationItemParticipants.id, params.organizationItemParticipant))
			.returning({ organizationItem: organizationItemParticipants.organizationItem })

		if(!result) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Sitzungsteilnahmegruppe nicht gefunden',
				data: {
					organizationItemParticipantId: params.organizationItemParticipant,
				},
			})
		}

		await client.connect()
		const { id: committeeId } = await client.presenters.search_for_id_by_external_id({
			collection: 'committee',
			external_id: result.organizationItem,
			context_id: 1,
		})
		const { id: templateId } = await client.presenters.search_for_id_by_external_id({
			collection: 'meeting',
			external_id: `${result.organizationItem}-Template`,
			context_id: committeeId,
		})
		const { id: groupId } = await client.presenters.search_for_id_by_external_id({
			collection: 'group',
			external_id: params.organizationItemParticipant,
			context_id: templateId,
		})
		await client.group.update({
			id: groupId,
			name: body.groupName,
		})
	})
})
