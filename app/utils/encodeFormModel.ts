import type { ExpenseAuthorizationFormModel } from '~/types'

const encoders = {
	expenseAuthorizations: (model: ExpenseAuthorizationFormModel) => ({
		...model,
		budgetPlanItem: model.budgetPlanItem?.id ?? null,
	}),
} as const

export function encodeFormModel<
	T extends keyof typeof encoders,
>(
	table: T,
	model: Parameters<typeof encoders[T]>[0],
) {
	return encoders[table](model)
}
