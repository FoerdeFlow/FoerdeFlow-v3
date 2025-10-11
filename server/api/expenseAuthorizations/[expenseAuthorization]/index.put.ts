import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		expenseAuthorization: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		...createUpdateSchema(expenseAuthorizations).omit({ id: true }).shape,
		items: z.array(
			z.strictObject({
				id: z.uuid().optional(),
				...createInsertSchema(expenseAuthorizationItems)
					.omit({ id: true, expenseAuthorization: true })
					.shape,
			}),
		).min(1),
	}).parseAsync(data))

	const database = useDatabase()

	const expenseAuthorization = await database.query.expenseAuthorizations.findFirst({
		where: eq(expenseAuthorizations.id, params.expenseAuthorization),
		with: {
			budgetPlanItem: {
				with: {
					plan: {
						with: {
							budget: {
								columns: {
									organizationItem: true,
								},
							},
						},
						columns: {},
					},
				},
				columns: {},
			},
		},
		columns: {},
	})

	await checkPermission(
		'expenseAuthorizations.update',
		{ organizationItem: expenseAuthorization?.budgetPlanItem.plan.budget.organizationItem },
	)

	await database.transaction(async (tx) => {
		const result = await tx
			.update(expenseAuthorizations)
			.set(body)
			.where(eq(expenseAuthorizations.id, params.expenseAuthorization))

		if(result.rowCount === 0) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Ausgabeermächtigung nicht gefunden',
				data: {
					expenseAuthorizationId: params.expenseAuthorization,
				},
			})
		}

		const existingItems = await tx.query.expenseAuthorizationItems.findMany({
			where: eq(expenseAuthorizationItems.expenseAuthorization, params.expenseAuthorization),
			columns: {
				id: true,
			},
		})

		for(const { id: itemId, ...item } of body.items) {
			if(itemId) {
				await tx
					.update(expenseAuthorizationItems)
					.set(item)
					.where(eq(expenseAuthorizationItems.id, itemId))
			} else {
				await tx
					.insert(expenseAuthorizationItems)
					.values({
						...item,
						expenseAuthorization: params.expenseAuthorization,
					})
			}
		}

		const deletedItems = existingItems
			.filter((existingItem) => !body.items.some((item) => item.id === existingItem.id))

		for(const deletedItem of deletedItems) {
			await tx
				.delete(expenseAuthorizationItems)
				.where(eq(expenseAuthorizationItems.id, deletedItem.id))
		}
	})
})
