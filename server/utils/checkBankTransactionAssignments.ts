import { eq } from 'drizzle-orm'

function refuse(statusMessage: string): never {
	throw createError({
		statusCode: 400,
		statusMessage,
	})
}

/**
 * Checks the parts a transaction is to be assigned to and completes them.
 *
 * The parts must not add up to more than the transaction, and they may only
 * book on budgets of the organization item owning the account. A part
 * referring to a payment order books on the budget plan item or the reserve
 * the order is paid out of; a part naming a different one is refused.
 *
 * @param tx - The transaction to read in
 * @param transaction - The bank transaction to assign
 * @param organizationItem - The organization item owning the account
 * @param assignments - The parts as sent by the client
 * @returns The parts, ready to be stored
 */
export async function checkBankTransactionAssignments(
	tx: ReturnType<typeof useDatabase>,
	transaction: {
		amount: number
		direction: 'credit' | 'debit'
	},
	organizationItem: string,
	assignments: BankTransactionAssignmentInput[],
) {
	if(currencySum(...assignments.map((item) => item.amount)) > transaction.amount) {
		refuse('Die Teilbeträge übersteigen den Betrag der Zahlung')
	}

	const result = []

	for(const assignment of assignments) {
		let { type, budgetPlanItem, budget } = assignment

		if(assignment.paymentOrder) {
			if(transaction.direction !== 'debit') {
				refuse('Nur eine ausgehende Zahlung kann eine Zahlungsanweisung ausführen')
			}

			const order = await tx.query.paymentOrders.findFirst({
				where: eq(paymentOrders.id, assignment.paymentOrder),
				columns: {
					type: true,
					budgetPlanItem: true,
					budget: true,
				},
			})

			if(!order) {
				refuse('Die angegebene Zahlungsanweisung wurde nicht gefunden')
			}

			const named = Boolean(type ?? budgetPlanItem ?? budget)
			if(named && (
				(type ?? 'planned') !== order.type ||
				(budgetPlanItem ?? null) !== order.budgetPlanItem ||
				(budget ?? null) !== order.budget
			)) {
				refuse('Die Zuordnung bucht auf einen anderen Haushaltstitel als die ' +
					'Zahlungsanweisung, auf die sie sich beruft')
			}

			type = order.type
			budgetPlanItem = order.budgetPlanItem
			budget = order.budget
		}

		type ??= 'planned'

		let owner
		if(type === 'planned') {
			if(!budgetPlanItem || budget) {
				refuse('Eine Zuordnung zu einem Haushaltstitel braucht genau einen Titel')
			}

			const item = await tx.query.budgetPlanItems.findFirst({
				where: eq(budgetPlanItems.id, budgetPlanItem),
				columns: {},
				with: {
					plan: {
						columns: {},
						with: {
							budget: {
								columns: {
									organizationItem: true,
								},
							},
						},
					},
				},
			})

			owner = item?.plan.budget.organizationItem
		} else {
			if(!budget || budgetPlanItem) {
				refuse('Eine Zuordnung zur Rücklage braucht genau einen Haushalt')
			}

			const reserve = await tx.query.budgets.findFirst({
				where: eq(budgets.id, budget),
				columns: {
					organizationItem: true,
				},
			})

			owner = reserve?.organizationItem
		}

		if(!owner) {
			refuse(type === 'planned'
				? 'Der angegebene Haushaltstitel wurde nicht gefunden'
				: 'Der angegebene Haushalt wurde nicht gefunden')
		}

		if(owner !== organizationItem) {
			refuse('Zahlungen können nur Haushalten der Organisationseinheit zugeordnet ' +
				'werden, der das Bankkonto gehört')
		}

		result.push({
			type,
			budgetPlanItem: budgetPlanItem ?? null,
			budget: budget ?? null,
			paymentOrder: assignment.paymentOrder ?? null,
			amount: assignment.amount,
			note: assignment.note?.length ? assignment.note : null,
		})
	}

	return result
}
