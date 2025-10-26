import { eq, type InferSelectModel } from 'drizzle-orm'

const encoders = {
	expenseAuthorizations: async (
		tx: ReturnType<typeof useDatabase>,
		model: InferSelectModel<typeof expenseAuthorizations> & {
			items: InferSelectModel<typeof expenseAuthorizationItems>[]
		},
	) => ({
		...model,
		budgetPlanItem: await tx.query.budgetPlanItems.findFirst({
			where: eq(budgetPlanItems.id, model.budgetPlanItem),
			with: {
				plan: {
					with: {
						budget: true,
					},
					columns: {
						budget: false,
					},
				},
			},
			columns: {
				plan: false,
			},
		}) ?? null,
	}),
} as const

export async function encodeProcessData<
	T extends keyof typeof encoders,
>(
	tx: ReturnType<typeof useDatabase>,
	table: T,
	model: Parameters<typeof encoders[T]>[1],
) {
	return await encoders[table](tx, model)
}
