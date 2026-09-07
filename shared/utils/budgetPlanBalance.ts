interface BudgetPlanBalanceItem {
	revenues?: number | null
	expenses?: number | null
}

/**
 * Sums up the balance of budget plan items.
 *
 * The amounts have two decimal places, so adding them up as floating point
 * numbers introduces rounding errors, which must not be reported as an
 * imbalance. Summing the amounts in whole cents avoids them entirely.
 *
 * @param items - The items of the budget plan
 * @returns The difference between the revenues and the expenses
 */
export function budgetPlanBalance(items: readonly BudgetPlanBalanceItem[]): number {
	const cents = items.reduce(
		(sum, item) => sum +
			Math.round((item.revenues ?? 0) * 100) -
			Math.round((item.expenses ?? 0) * 100),
		0,
	)
	return cents / 100
}

/**
 * Checks whether the revenues and the expenses of a budget plan are equal.
 *
 * @param items - The items of the budget plan
 * @returns Whether the budget plan is balanced
 */
export function budgetPlanBalanced(items: readonly BudgetPlanBalanceItem[]): boolean {
	return budgetPlanBalance(items) === 0
}

/**
 * Sums up an amount of a budget plan's items.
 *
 * Like {@link budgetPlanBalance}, the amounts are summed up in whole cents so
 * that no rounding error is introduced.
 *
 * @param items - The items of the budget plan
 * @param field - The amount to sum up
 * @returns The sum of the amounts
 */
export function budgetPlanTotal(
	items: readonly BudgetPlanBalanceItem[],
	field: 'revenues' | 'expenses',
): number {
	return items.reduce((sum, item) => sum + Math.round((item[field] ?? 0) * 100), 0) / 100
}
