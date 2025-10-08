import { createInsertSchema, createUpdateSchema } from 'drizzle-zod'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		budgetPlan: idSchema,
	}).parseAsync(data))

	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		...createUpdateSchema(budgetPlans).omit({ id: true }).shape,
		items: z.array(
			z.strictObject({
				id: z.uuid().optional(),
				...createInsertSchema(budgetPlanItems).omit({ id: true, plan: true }).shape,
			}),
		).min(1),
	}).parseAsync(data))

	const database = useDatabase()

	const budgetPlan = await database.query.budgetPlans.findFirst({
		where: eq(budgetPlans.id, params.budgetPlan),
		with: {
			budget: {
				columns: {
					organizationItem: true,
				},
			},
		},
		columns: {},
	})

	await checkPermission('budgetPlans.update', { organizationItem: budgetPlan?.budget.organizationItem })

	await database.transaction(async (tx) => {
		const result = await tx
			.update(budgetPlans)
			.set(body)
			.where(eq(budgetPlans.id, params.budgetPlan))

		if(result.rowCount === 0) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Haushaltsplan nicht gefunden',
				data: {
					budgetPlanId: params.budgetPlan,
				},
			})
		}

		const existingItems = await tx.query.budgetPlanItems.findMany({
			where: eq(budgetPlanItems.plan, params.budgetPlan),
			columns: {
				id: true,
			},
		})

		for(const { id: itemId, ...item } of body.items) {
			if(itemId) {
				await tx
					.update(budgetPlanItems)
					.set(item)
					.where(eq(budgetPlanItems.id, itemId))
			} else {
				await tx
					.insert(budgetPlanItems)
					.values({
						...item,
						plan: params.budgetPlan,
					})
			}
		}

		const deletedItems = existingItems
			.filter((existingItem) => !body.items.some((item) => item.id === existingItem.id))

		for(const deletedItem of deletedItems) {
			await tx
				.delete(budgetPlanItems)
				.where(eq(budgetPlanItems.id, deletedItem.id))
		}
	})
})
