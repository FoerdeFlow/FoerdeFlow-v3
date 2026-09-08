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

		await checkPermission(
			'paymentOrders.read',
			{ organizationItem: budgetPlan?.budget.organizationItem },
		)

		if(!budgetPlan) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Haushaltsplan nicht gefunden',
				data: {
					budgetPlanId: query.budgetPlan,
				},
			})
		}

		where = inArray(
			paymentOrders.budgetPlanItem,
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

		await checkPermission(
			'paymentOrders.read',
			{ organizationItem: budget?.organizationItem },
		)

		if(!budget) {
			throw createError({
				statusCode: 404,
				statusMessage: 'Haushalt nicht gefunden',
				data: {
					budgetId: query.budget,
				},
			})
		}

		where = eq(paymentOrders.budget, query.budget)
	} else {
		return []
	}

	const result = await database.query.paymentOrders.findMany({
		where,
		with: {
			budgetPlanItem: true,
			// The bank details of a member are guarded by a permission of their
			// own, so the list never carries them.
			recipientPerson: {
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					callName: true,
					pronouns: true,
				},
			},
		},
		columns: {
			budgetPlanItem: false,
			recipientPerson: false,
		},
	})

	return result
})
