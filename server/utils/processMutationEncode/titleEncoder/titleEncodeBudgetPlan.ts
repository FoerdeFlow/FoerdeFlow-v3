export function titleEncodeBudgetPlan(entry: {
	budget: {
		code: string
	} | null
	startDate: string
	endDate: string
}) {
	if(!entry.budget) {
		throw createError({
			status: 500,
			message: 'Invalid budgetPlan object (no budget)',
		})
	}

	// A budget plan carries no title of its own, so it is named after the period
	// it covers.
	return `${entry.budget.code} - Haushaltsplan ${formatBudgetPlan(entry)}`
}
