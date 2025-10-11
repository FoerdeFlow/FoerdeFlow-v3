import { eq } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		...createInsertSchema(expenseAuthorizations).omit({ id: true }).shape,
		items: z.array(
			createInsertSchema(expenseAuthorizationItems)
				.omit({ id: true, expenseAuthorization: true }),
		).min(1),
	}).parseAsync(data))

	const database = useDatabase()

	const budgetPlanItem = await database.query.budgetPlanItems.findFirst({
		where: eq(budgetPlanItems.id, body.budgetPlanItem),
		with: {
			plan: {
				with: {
					budget: {
						columns: {
							organizationItem: true,
						},
					},
				},
			},
		},
		columns: {},
	})

	await checkPermission(
		'expenseAuthorizations.create',
		{ organizationItem: budgetPlanItem?.plan.budget.organizationItem },
	)

	return await database.transaction(async (tx) => {
		const [ result ] = await tx
			.insert(expenseAuthorizations)
			.values(body)
			.returning({ id: expenseAuthorizations.id })

		for(const item of body.items) {
			await tx
				.insert(expenseAuthorizationItems)
				.values({
					...item,
					expenseAuthorization: result.id,
				})
		}

		return result
	})
})
