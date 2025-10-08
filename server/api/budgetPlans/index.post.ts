import { eq } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import z from 'zod'

export default defineEventHandler(async (event) => {
	const body = await readValidatedBody(event, async (data) => await z.strictObject({
		...createInsertSchema(budgetPlans).omit({ id: true }).shape,
		items: z.array(
			z.strictObject({
				id: z.uuid().optional(),
				...createInsertSchema(budgetPlanItems).omit({ id: true, plan: true }).shape,
			}),
		)
			.min(1)
			.check((ctx) => {
				const balance = ctx.value
					.map((item) => item.revenues - item.expenses)
					.reduce((a, b) => a + b, 0)

				if(Math.abs(balance) > 0.00001) {
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
