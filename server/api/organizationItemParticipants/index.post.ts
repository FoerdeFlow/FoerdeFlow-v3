import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	const database = useDatabase()
	const client = useOpenslides()

	const body = await readValidatedBody(event, createInsertSchema(organizationItemParticipants).omit({ id: true }).parseAsync)

	return await database.transaction(async (tx) => {
		const [ result ] = await tx.insert(organizationItemParticipants).values(body).returning({ id: organizationItemParticipants.id })

		await client.connect()
		const { id: committeeId } = await client.presenters.search_for_id_by_external_id({
			collection: 'committee',
			external_id: body.organizationItem,
			context_id: 1,
		})
		const { id: templateId } = await client.presenters.search_for_id_by_external_id({
			collection: 'meeting',
			external_id: `${body.organizationItem}-Template`,
			context_id: committeeId,
		})
		await client.group.create({
			external_id: result.id,
			meeting_id: templateId,
			name: body.groupName,
		})

		return result
	})
})