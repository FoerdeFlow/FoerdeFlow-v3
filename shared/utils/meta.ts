export function metaAmount(meta: unknown, key: string): number | null {
	if(typeof meta !== 'object' || meta === null || !(key in meta)) {
		return null
	}

	const value = (meta as Record<string, unknown>)[key]
	return typeof value === 'number' && value > 0 ? value : null
}

/**
 * Reads from the meta data of a mutation which budgets it may be applied to.
 *
 * `initiator` restricts the choice to the budgets of the organization item the
 * process is started for, so that a body cannot spend out of a budget it does
 * not answer for. Without the key the choice stays open.
 *
 * @param meta - The meta data of the mutation
 * @returns The configured scope, or `null` if the budgets are not restricted
 */
export function metaBudgetScope(meta: unknown): 'initiator' | null {
	return typeof meta === 'object' && meta !== null &&
		'budgetScope' in meta && meta.budgetScope === 'initiator'
		? 'initiator'
		: null
}
