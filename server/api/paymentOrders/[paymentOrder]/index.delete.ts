import { eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const params = await getValidatedRouterParams(event, async (data) => await z.object({
		paymentOrder: idSchema,
	}).parseAsync(data))

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
			'paymentOrders.delete',
			{ organizationItem: paymentOrder.budgetPlanItem?.plan.budget.organizationItem },
		)
	} else {
		await checkPermission(
			'paymentOrders.delete',
			{ organizationItem: paymentOrder?.budget?.organizationItem },
		)
	}

	const result = await database
		.delete(paymentOrders)
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
