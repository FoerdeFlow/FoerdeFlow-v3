import { eq } from 'drizzle-orm'

function refuse(statusMessage: string): never {
	throw createError({
		statusCode: 400,
		statusMessage,
	})
}

/**
 * Reads the document a part of a transaction refers to and where it is paid
 * from, after checking that the money flows in the direction it may.
 *
 * @param tx - The transaction to read in
 * @param transaction - The bank transaction to assign
 * @param assignment - The part as sent by the client
 * @returns The budget plan item or reserve of the document, if one is named
 */
async function readAssignedDocument(
	tx: ReturnType<typeof useDatabase>,
	transaction: { direction: 'credit' | 'debit' },
	assignment: BankTransactionAssignmentInput,
) {
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
		if(!order) refuse('Die angegebene Zahlungsanweisung wurde nicht gefunden')
		return order
	}

	const permitColumns = {
		columns: {
			type: true,
			budgetPlanItem: true,
			budget: true,
		},
	} as const

	if(assignment.travelAdvance) {
		if(transaction.direction !== 'debit') {
			refuse('Nur eine ausgehende Zahlung kann einen Vorschuss auszahlen')
		}

		const advance = await tx.query.travelAdvances.findFirst({
			where: eq(travelAdvances.id, assignment.travelAdvance),
			with: {
				permit: permitColumns,
			},
			columns: {},
		})
		if(!advance) refuse('Der angegebene Vorschuss wurde nicht gefunden')
		return advance.permit
	}

	if(assignment.travelClaim) {
		const claim = await tx.query.travelClaims.findFirst({
			where: eq(travelClaims.id, assignment.travelClaim),
			with: {
				permit: permitColumns,
			},
			columns: {
				payoutAmount: true,
			},
		})
		if(!claim) refuse('Die angegebene Reisekostenerstattung wurde nicht gefunden')

		if(transaction.direction === 'debit' && claim.payoutAmount <= 0) {
			refuse('Aus dieser Reisekostenerstattung ist nichts auszuzahlen')
		}
		if(transaction.direction === 'credit' && claim.payoutAmount >= 0) {
			refuse('Aus dieser Reisekostenerstattung ist nichts zurückzuzahlen')
		}
		return claim.permit
	}

	return null
}

/**
 * Checks the parts a transaction is to be assigned to and completes them.
 *
 * The parts must not add up to more than the transaction, and they may only
 * book on budgets of the organization item owning the account. A transfer
 * between own accounts books on no budget at all. A part referring to a
 * payment order, an advance or a claim for travel costs books on the budget
 * plan item or the reserve that document is paid out of; a part naming a
 * different one is refused. Only a claim whose advance exceeded the costs may
 * be referred to by incoming money, as its repayment.
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
		if(assignment.type === 'transfer') {
			if(
				assignment.budgetPlanItem || assignment.budget || assignment.paymentOrder ||
				assignment.travelAdvance || assignment.travelClaim
			) {
				refuse('Eine Umbuchung zwischen eigenen Konten bucht auf keinen Haushalt')
			}

			result.push({
				type: 'transfer' as const,
				budgetPlanItem: null,
				budget: null,
				paymentOrder: null,
				travelAdvance: null,
				travelClaim: null,
				amount: assignment.amount,
				note: assignment.note?.length ? assignment.note : null,
			})
			continue
		}

		let { type, budgetPlanItem, budget } = assignment

		const documents = [
			assignment.paymentOrder,
			assignment.travelAdvance,
			assignment.travelClaim,
		].filter(Boolean)
		if(documents.length > 1) {
			refuse('Eine Zuordnung kann sich nur auf einen Beleg berufen')
		}

		const document = await readAssignedDocument(tx, transaction, assignment)
		if(document) {
			const named = Boolean(type ?? budgetPlanItem ?? budget)
			if(named && (
				(type ?? 'planned') !== document.type ||
				(budgetPlanItem ?? null) !== document.budgetPlanItem ||
				(budget ?? null) !== document.budget
			)) {
				refuse('Die Zuordnung bucht auf einen anderen Haushaltstitel als der ' +
					'Beleg, auf den sie sich beruft')
			}

			type = document.type
			budgetPlanItem = document.budgetPlanItem
			budget = document.budget
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
			travelAdvance: assignment.travelAdvance ?? null,
			travelClaim: assignment.travelClaim ?? null,
			amount: assignment.amount,
			note: assignment.note?.length ? assignment.note : null,
		})
	}

	return result
}
