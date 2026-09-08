import { eq } from 'drizzle-orm'

/**
 * Checks that a mutation is applied to a budget the initiator answers for.
 *
 * A mutation only carries the restriction once its workflow asks for it, so
 * without the meta flag every budget stays available. The check also passes for
 * a process a person started for themselves, because such a process has no
 * organization item its budgets could be measured against.
 *
 * @param tx - The transaction to read in
 * @param origin - The budget of the mutation, either directly or by its title
 * @param context - The initiator and the meta data of the mutation
 */
export async function checkBudgetOrigin(
	tx: ReturnType<typeof useDatabase>,
	origin: {
		budget?: string | null
		budgetPlanItem?: string | null
	},
	context: {
		initiatorType: 'person' | 'organizationItem'
		initiatorOrganizationItem: string | null
		meta: unknown
	},
) {
	if(metaBudgetScope(context.meta) !== 'initiator') return
	if(context.initiatorType !== 'organizationItem' || !context.initiatorOrganizationItem) return

	let organizationItem
	if(origin.budget) {
		const budget = await tx.query.budgets.findFirst({
			where: eq(budgets.id, origin.budget),
			columns: {
				organizationItem: true,
			},
		})
		if(!budget) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Der angegebene Haushalt wurde nicht gefunden',
				data: { budgetId: origin.budget },
			})
		}
		organizationItem = budget.organizationItem
	} else if(origin.budgetPlanItem) {
		const item = await tx.query.budgetPlanItems.findFirst({
			where: eq(budgetPlanItems.id, origin.budgetPlanItem),
			with: {
				plan: {
					with: {
						budget: {
							columns: {
								organizationItem: true,
							},
						},
					},
					columns: {},
				},
			},
			columns: {},
		})
		if(!item) {
			throw createError({
				statusCode: 400,
				statusMessage: 'Der angegebene Haushaltstitel wurde nicht gefunden',
				data: { budgetPlanItemId: origin.budgetPlanItem },
			})
		}
		organizationItem = item.plan.budget.organizationItem
	} else {
		return
	}

	if(organizationItem !== context.initiatorOrganizationItem) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Der gewählte Haushalt gehört nicht zur antragstellenden ' +
				'Organisationseinheit',
		})
	}
}
