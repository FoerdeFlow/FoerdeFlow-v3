import { eq } from 'drizzle-orm'

/**
 * Checks that a payment order is paid out of the same budget as the expense
 * authorization it refers to.
 *
 * A payment order may stand on its own, so an order without a reference passes
 * right away. Once there is one, the order must not move the payment to another
 * budget title or to the reserve behind the back of the authorization.
 *
 * @param tx - The transaction to read in
 * @param order - The origin of the payment order and the reference to check
 */
export async function checkPaymentOrderOrigin(
	tx: ReturnType<typeof useDatabase>,
	order: {
		expenseAuthorization?: string | null
		type?: 'planned' | 'reserve' | null
		budgetPlanItem?: string | null
		budget?: string | null
	},
) {
	if(!order.expenseAuthorization) return

	const authorization = await tx.query.expenseAuthorizations.findFirst({
		where: eq(expenseAuthorizations.id, order.expenseAuthorization),
		columns: {
			type: true,
			budgetPlanItem: true,
			budget: true,
		},
	})

	if(!authorization) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Die angegebene Ausgabeermächtigung wurde nicht gefunden',
			data: { expenseAuthorizationId: order.expenseAuthorization },
		})
	}

	if((order.type ?? 'planned') !== authorization.type) {
		throw createError({
			statusCode: 400,
			statusMessage: authorization.type === 'reserve'
				? 'Die Ausgabeermächtigung wird aus der Rücklage bezahlt, die ' +
					'Zahlungsanweisung aber aus einem Haushaltstitel'
				: 'Die Ausgabeermächtigung wird aus einem Haushaltstitel bezahlt, die ' +
					'Zahlungsanweisung aber aus der Rücklage',
		})
	}

	if(authorization.type === 'planned'
		? (order.budgetPlanItem ?? null) !== authorization.budgetPlanItem
		: (order.budget ?? null) !== authorization.budget) {
		throw createError({
			statusCode: 400,
			statusMessage: authorization.type === 'planned'
				? 'Die Zahlungsanweisung wird aus einem anderen Haushaltstitel bezahlt als ' +
					'die Ausgabeermächtigung, auf die sie sich beruft'
				: 'Die Zahlungsanweisung wird aus der Rücklage eines anderen Haushalts ' +
					'bezahlt als die Ausgabeermächtigung, auf die sie sich beruft',
		})
	}
}
