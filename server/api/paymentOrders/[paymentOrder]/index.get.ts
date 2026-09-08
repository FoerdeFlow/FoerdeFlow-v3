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
									id: true,
									organizationItem: true,
									code: true,
									name: true,
									periodType: true,
								},
							},
						},
						columns: {
							id: true,
							startDate: true,
							endDate: true,
						},
					},
				},
				columns: {
					plan: false,
				},
			},
			budget: {
				with: {
					organizationItem: true,
				},
				columns: {
					organizationItem: false,
				},
			},
			// Expanded the same way the list of expense authorizations is, so
			// that the editor can hand the value straight back to its select.
			expenseAuthorization: {
				with: {
					budgetPlanItem: true,
				},
				columns: {
					budgetPlanItem: false,
				},
			},
			recipientPerson: {
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					callName: true,
					pronouns: true,
					iban: true,
				},
			},
		},
		columns: {
			budgetPlanItem: false,
			recipientPerson: false,
		},
	})

	if(paymentOrder?.type === 'planned') {
		await checkPermission(
			'paymentOrders.read',
			{ organizationItem: paymentOrder.budgetPlanItem?.plan.budget.organizationItem },
		)
	} else {
		await checkPermission(
			'paymentOrders.read',
			{ organizationItem: paymentOrder?.budget?.organizationItem.id },
		)
	}

	if(!paymentOrder) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Zahlungsanweisung nicht gefunden',
			data: {
				paymentOrderId: params.paymentOrder,
			},
		})
	}

	// Bank details are payment data, so the IBAN of the member a reimbursement
	// goes to is only handed out to those who were granted the permission of its
	// own that guards it. Missing it leaves out the IBAN instead of refusing the
	// whole payment order.
	if(paymentOrder.recipientPerson && !hasPermission('personBankDetails.read')) {
		const { iban: _iban, ...recipientPerson } = paymentOrder.recipientPerson
		return { ...paymentOrder, recipientPerson: { ...recipientPerson, iban: null } }
	}

	return paymentOrder
})
