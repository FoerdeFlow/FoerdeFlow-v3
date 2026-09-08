import { eq } from 'drizzle-orm'
import { createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		paymentOrder: idSchema,
	}).parseAsync(data))

	// The editor always hands in the whole payment order, so the variants can be
	// checked here just as they are on creation.
	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		...createUpdateSchema(paymentOrders).omit({ id: true }).shape,
		recipientIban: paymentOrderIbanSchema.nullable().optional(),
	}).refine(paymentOrderVariantsValid).parseAsync(data))

	const database = useDatabase()

	const paymentOrder = await database.query.paymentOrders.findFirst({
		where: eq(paymentOrders.id, params.paymentOrder),
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
			budget: {
				columns: {
					organizationItem: true,
				},
			},
		},
		columns: {
			type: true,
		},
	})

	if(paymentOrder?.type === 'planned') {
		await checkPermission(
			'paymentOrders.update',
			{ organizationItem: paymentOrder.budgetPlanItem?.plan.budget.organizationItem },
		)
	} else {
		await checkPermission(
			'paymentOrders.update',
			{ organizationItem: paymentOrder?.budget?.organizationItem },
		)
	}

	await database.transaction(async (tx) => {
		await checkPaymentOrderOrigin(tx, body)

		const result = await tx
			.update(paymentOrders)
			.set(body)
			.where(eq(paymentOrders.id, params.paymentOrder))

		if(result.rowCount === 0) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Zahlungsanweisung nicht gefunden',
				data: {
					paymentOrderId: params.paymentOrder,
				},
			})
		}
	})
})
