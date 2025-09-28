import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('organizationItemGroups.create')

	const database = useDatabase()
	const client = useOpenslides()

	const body = await readValidatedBody(event, async (data) => z.object({
		...createInsertSchema(organizationItemGroups).omit({
			id: true,
		}).shape,
		members: z.array(createInsertSchema(organizationItemGroupMembers).omit({
			id: true,
			organizationItemGroup: true,
		})),
	}).parseAsync(data))

	return await database.transaction(async (tx) => {
		const { members, ...group } = body

		const [ { id: groupId } ] = await tx
			.insert(organizationItemGroups)
			.values(group)
			.returning({ id: organizationItemGroups.id })

		for(const member of members) {
			await tx
				.insert(organizationItemGroupMembers)
				.values({
					...member,
					organizationItemGroup: groupId,
				})
		}

		await client.connect()
		const templateId = await getOpenslidesTemplateMeetingId(client, body.organizationItem)
		await client.group.create({
			external_id: groupId,
			meeting_id: templateId,
			name: body.roleName,
		})

		return { id: groupId }
	})
})
