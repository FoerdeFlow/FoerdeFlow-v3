import { eq } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		...createInsertSchema(paymentOrders).omit({ id: true }).shape,
		recipientIban: paymentOrderIbanSchema.nullable().optional(),
	}).refine(paymentOrderVariantsValid).parseAsync(data))

	const database = useDatabase()

	const budgetPlanItem = body.budgetPlanItem
		? await database.query.budgetPlanItems.findFirst({
			where: eq(budgetPlanItems.id, body.budgetPlanItem),
			with: {
				plan: {
					with: {
						budget: {
							columns: {
								organizationItem: true,
							},
						},
					},
				},
			},
			columns: {},
		})
		: undefined

	const budget = body.budget
		? await database.query.budgets.findFirst({
			where: eq(budgets.id, body.budget),
			columns: {
				organizationItem: true,
			},
		})
		: undefined

	await checkPermission(
		'paymentOrders.create',
		{ organizationItem: budgetPlanItem?.plan.budget.organizationItem ?? budget?.organizationItem },
	)

	return await database.transaction(async (tx) => {
		await checkPaymentOrderOrigin(tx, body)

		const [ result ] = await tx
			.insert(paymentOrders)
			.values(body)
			.returning({ id: paymentOrders.id })

		if(!result) {
			throw createError({
				statusCode: 500,
				statusMessage: 'Zahlungsanweisung konnte nicht erstellt werden',
			})
		}

		return result
	})
})
