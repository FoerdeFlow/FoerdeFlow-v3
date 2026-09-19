export function titleEncodeExpenseAuthorization(entry: {
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
	// An expense may be paid out of a title of a budget plan or out of the
	// reserve, and the budget follows whichever of the two it is.
	const budget = entry.budgetPlanItem?.plan.budget ?? entry.budget
	if(!budget) {
		throw createError({
			status: 500,
			message: 'Invalid expenseAuthorization object (neither budget nor budgetPlanItem)',
		})
	}

	return `${budget.code} - ${entry.title}`
}
