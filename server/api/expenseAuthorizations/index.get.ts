import { eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
	const query = await getValidatedQuery(event, async (data) => await z.object({
		budgetPlan: idSchema.optional(),
		budget: idSchema.optional(),
	}).refine((o) => Boolean(o.budgetPlan) !== Boolean(o.budget)).parseAsync(data))

	const database = useDatabase()

	let where
	if(query.budgetPlan) {
		const budgetPlan = await database.query.budgetPlans.findFirst({
			where: eq(budgetPlans.id, query.budgetPlan),
			with: {
				budget: {
					columns: {
						organizationItem: true,
					},
				},
			},
			columns: {},
		})

		await checkPermission('expenseAuthorizations.read', { organizationItem: budgetPlan?.budget.organizationItem })

		if(!budgetPlan) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Budget plan not found',
				data: {
					budgetPlanId: query.budgetPlan,
				},
			})
		}

		where = inArray(
			expenseAuthorizations.budgetPlanItem,
			database
				.select({ id: budgetPlanItems.id })
				.from(budgetPlanItems)
				.where(eq(budgetPlanItems.plan, query.budgetPlan)),
		)
	} else if(query.budget) {
		const budget = await database.query.budgets.findFirst({
			where: eq(budgets.id, query.budget),
			columns: {
				organizationItem: true,
			},
		})

		await checkPermission('expenseAuthorizations.read', { organizationItem: budget?.organizationItem })

		if(!budget) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Budget not found',
				data: {
					budgetId: query.budget,
				},
			})
		}

		where = eq(expenseAuthorizations.budget, query.budget)
	} else {
		return []
	}

	const result = await database.query.expenseAuthorizations.findMany({
		where,
		with: {
			budgetPlanItem: true,
		},
		columns: {
			budgetPlanItem: false,
		},
	})

	return result
})
