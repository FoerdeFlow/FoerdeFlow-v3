import { eq } from 'drizzle-orm'
import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		longtermContract: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		...createUpdateSchema(longtermContracts).omit({ id: true }).shape,
		items: z.array(
			z.strictObject({
				id: z.uuid().optional(),
				...createInsertSchema(longtermContractItems)
					.omit({ id: true, longtermContract: true })
					.shape,
			}),
		).min(1),
	}).parseAsync(data))

	const database = useDatabase()

	const longtermContract = await database.query.longtermContracts.findFirst({
		where: eq(longtermContracts.id, params.longtermContract),
		with: {
			budget: {
				columns: {
					organizationItem: true,
				},
			},
		},
		columns: {},
	})

	await checkPermission(
		'longtermContracts.update',
		{ organizationItem: longtermContract?.budget.organizationItem },
	)

	await database.transaction(async (tx) => {
		const result = await tx
			.update(longtermContracts)
			.set(body)
			.where(eq(longtermContracts.id, params.longtermContract))

		if(result.rowCount === 0) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Langzeitvertrag nicht gefunden',
				data: {
					longtermContractId: params.longtermContract,
				},
			})
		}

		const existingItems = await tx.query.longtermContractItems.findMany({
			where: eq(longtermContractItems.longtermContract, params.longtermContract),
			columns: {
				id: true,
			},
		})

		for(const { id: itemId, ...item } of body.items) {
			if(itemId) {
				await tx
					.update(longtermContractItems)
					.set(item)
					.where(eq(longtermContractItems.id, itemId))
			} else {
				await tx
					.insert(longtermContractItems)
					.values({
						...item,
						longtermContract: params.longtermContract,
					})
			}
		}

		const deletedItems = existingItems
			.filter((existingItem) => !body.items.some((item) => item.id === existingItem.id))

		for(const deletedItem of deletedItems) {
			await tx
				.delete(longtermContractItems)
				.where(eq(longtermContractItems.id, deletedItem.id))
		}
	})
})
