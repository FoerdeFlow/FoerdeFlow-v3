import { createInsertSchema } from 'drizzle-zod'

export default defineEventHandler(async (event) => {
	await checkPermission('organizationItems.create')

	const database = useDatabase()
	const client = useOpenslides()

	const body = await readValidatedBody(event, async (data) =>
		await createInsertSchema(organizationItems).omit({ id: true }).parseAsync(data))

	return await database.transaction(async (tx) => {
		const [ result ] = await tx
			.insert(organizationItems)
			.values(body)
			.returning({ id: organizationItems.id })

		await client.connect()
		let parentId
		if(body.parent) {
			({ id: parentId } = await client.presenters.search_for_id_by_external_id({
				collection: 'committee',
				external_id: body.parent,
				context_id: 1,
			}))
		}
		await client.committee.create({
			name: `${body.name} (${body.code})`,
			organization_id: 1,
			...(parentId ? { parent_id: parentId } : {}),
			external_id: result.id,
		})

		return result
	})
})
