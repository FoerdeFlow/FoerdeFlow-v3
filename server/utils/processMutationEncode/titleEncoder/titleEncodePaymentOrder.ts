export function titleEncodePaymentOrder(entry: {
	budgetPlanItem: {
		plan: {
			budget: {
				code: string
			}
		}
	} | null
	budget: {
		code: string
	} | null
	title: string
}) {
	// A payment may be drawn from a title of a budget plan or from the reserve,
	// and the budget follows whichever of the two it is.
	const budget = entry.budgetPlanItem?.plan.budget ?? entry.budget
	if(!budget) {
		throw createError({
			status: 500,
			message: 'Invalid paymentOrder object (neither budget nor budgetPlanItem)',
		})
	}

	return `${budget.code} - ${entry.title}`
}
