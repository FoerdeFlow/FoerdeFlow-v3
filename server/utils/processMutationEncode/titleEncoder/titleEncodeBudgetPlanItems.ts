export function titleEncodeBudgetPlanItems(entry: {
	budget: {
		code: string
	} | null
	title: string
}) {
	if(!entry.budget) {
		throw createError({
			status: 500,
			message: 'Invalid budgetPlanItem object (no budget)',
		})
	}

	return `${entry.budget.code} - ${entry.title}`
}
