import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	await checkPermission('organizationItemGroups.update')

	const database = useDatabase()
	const client = useOpenslides()

	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		organizationItemGroup: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) => await z.object({
		...createUpdateSchema(organizationItemGroups).omit({
			id: true,
		}).shape,
		members: z.array(createInsertSchema(organizationItemGroupMembers).omit({
			id: true,
			organizationItemGroup: true,
		})).optional(),
	}).parseAsync(data))

	await database.transaction(async (tx) => {
		const { members: newMembers, ...group } = body

		const [ result = null ] = await tx
			.update(organizationItemGroups)
			.set(group)
			.where(eq(organizationItemGroups.id, params.organizationItemGroup))
			.returning({
				organizationItem: organizationItemGroups.organizationItem,
				roleName: organizationItemGroups.roleName,
			})

		if(!result) {
			throw createError({
				statusCode: 404,
				statusMessage: 'OE-Gruppe nicht gefunden',
				data: {
					organizationItemGroupId: params.organizationItemGroup,
				},
			})
		}

		if(newMembers) {
			const currentMembers = await tx.query.organizationItemGroupMembers.findMany({
				where: eq(
					organizationItemGroupMembers.organizationItemGroup,
					params.organizationItemGroup,
				),
				columns: {
					organizationItemGroup: false,
				},
			})
			const filterMissingMembers = <
				T extends typeof newMembers[number],
			>(a: T[], b: typeof newMembers): T[] =>
				a.filter((itemA) => !b.some((itemB) =>
					itemA.organizationItem === itemB.organizationItem &&
					itemA.membershipType === itemB.membershipType,
				))
			const membersToDelete = filterMissingMembers(currentMembers, newMembers)
			const membersToAdd = filterMissingMembers(newMembers, currentMembers)
			await Promise.all([
				...membersToDelete.map(async ({ id }) => await tx
					.delete(organizationItemGroupMembers)
					.where(eq(organizationItemGroupMembers.id, id)),
				),
				...membersToAdd.map(async (member) => await tx
					.insert(organizationItemGroupMembers)
					.values({
						organizationItemGroup: params.organizationItemGroup,
						...member,
					}),
				),
			])
		}

		await client.connect()
		const templateId = await getOpenslidesTemplateMeetingId(client, result.organizationItem)
		const { id: groupId } = await client.presenters.search_for_id_by_external_id({
			collection: 'group',
			external_id: params.organizationItemGroup,
			context_id: templateId,
		})
		await client.group.update({
			id: groupId,
			name: result.roleName,
		})
	})
})
