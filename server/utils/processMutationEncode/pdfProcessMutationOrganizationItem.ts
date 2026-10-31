interface BudgetOrigin {
	budgetPlanItem?: { plan: { budget: { organizationItem: string } } } | null
	budget?: { organizationItem: string } | null
}

/**
 * Finds the organization item a budget origin belongs to, either through the
 * title of a budget plan or through the budget itself.
 *
 * @param origin - The expanded origin of a mutation
 * @returns The id of the organization item, if there is one
 */
function budgetOriginOrganizationItem(origin: BudgetOrigin | null | undefined) {
	return origin?.budgetPlanItem?.plan.budget.organizationItem ?? origin?.budget?.organizationItem ?? null
}

/**
 * Finds the organization item whose logo the PDF of a process mutation
 * carries. That is the unit of the budget the mutation concerns, or the unit a
 * representation allowance is granted to.
 *
 * @param table - The table of the mutation, e.g. `expenseAuthorizations`
 * @param data - The mutation data expanded by {@link encodeProcessData}
 * @returns The id of the organization item, if there is one
 */
export function pdfProcessMutationOrganizationItem(
	table: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any,
): string | null {
	switch(table) {
		case 'budgetPlans':
		case 'budgetPlanItems':
		case 'longtermContracts':
		case 'expenseAuthorizations':
		case 'paymentOrders':
			return budgetOriginOrganizationItem(data)
		case 'representationAllowances':
			return data.organizationItem?.id ?? null
		// The role decides the letterhead of everything about a journey.
		case 'travelPermits':
			return data.role?.organizationItem?.id ?? null
		case 'travelAdvances':
		case 'travelClaims':
			return data.permit?.role?.organizationItem?.id ?? null
		default:
			return null
	}
}
