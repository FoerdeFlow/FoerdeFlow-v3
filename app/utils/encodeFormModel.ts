import type { ExpenseAuthorizationFormModel, WorkflowCustomCandidateFormModel } from '~/types'

const encoders = {
	candidates: (model: WorkflowCustomCandidateFormModel) => ({
		...model,
		electionCommittee: model.electionCommittee?.id ?? null,
		candidate: model.candidate?.id ?? null,
		course: model.course?.id ?? null,
	}),
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
	// @ts-expect-error | TypeScript cannot infer this yet
	return encoders[table](model)
}
