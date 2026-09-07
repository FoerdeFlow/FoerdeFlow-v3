import { eq } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		...createInsertSchema(budgetPlans).omit({ id: true }).shape,
		items: z.array(
			createInsertSchema(budgetPlanItems).omit({ id: true, plan: true }),
		)
			.min(1)
			.check((ctx) => {
				if(!budgetPlanBalanced(ctx.value)) {
					ctx.issues.push({
						code: 'custom',
						message: 'Sum of revenues and expenses must be equal.',
						input: ctx.value,
					})
				}
			}),
	}).parseAsync(data))

	const database = useDatabase()

	const budget = await database.query.budgets.findFirst({
		where: eq(budgets.id, body.budget),
		columns: {
			organizationItem: true,
		},
	})

	await checkPermission('budgetPlans.create', { organizationItem: budget?.organizationItem })

	return await database.transaction(async (tx) => {
		const [ result ] = await tx
			.insert(budgetPlans)
			.values(body)
			.returning({ id: budgetPlans.id })

		if(!result) {
			throw createError({
				statusCode: 500,
				statusMessage: 'Haushaltsplan konnte nicht erstellt werden',
			})
		}

		for(const item of body.items) {
			await tx
				.insert(budgetPlanItems)
				.values({
					...item,
					plan: result.id,
				})
		}

		return result
	})
})
