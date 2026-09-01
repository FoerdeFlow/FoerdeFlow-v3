import type {
	BudgetPlanFormModel,
	ExpenseAuthorizationFormModel,
	LongtermContractFormModel,
	RepresentationAllowanceFormModel,
	WorkflowCustomCandidateFormModel,
} from '~/types'

const encoders = {
	candidates: (model: WorkflowCustomCandidateFormModel) => {
		const { photo, ...rest } = model
		return {
			data: JSON.stringify({
				...rest,
				electionCommittee: model.electionCommittee?.id ?? null,
				candidate: model.candidate?.id ?? null,
				course: model.course?.id ?? null,
			}),
			attachment_photo: model.photo instanceof File ? model.photo : undefined,
		}
	},
	budgetPlans: (model: BudgetPlanFormModel) => ({
		data: JSON.stringify({
			...model,
			startDate: serializeDate(model.startDate),
			endDate: serializeDate(model.endDate),
			budget: model.budget?.id ?? null,
		}),
	}),
	expenseAuthorizations: (model: ExpenseAuthorizationFormModel) => ({
		data: JSON.stringify({
			...model,
			budgetPlanItem: model.budgetPlanItem?.id ?? null,
			budget: model.budget?.id ?? null,
		}),
	}),
	longtermContracts: (model: LongtermContractFormModel) => ({
		data: JSON.stringify({
			...model,
			startDate: serializeDate(model.startDate),
			endDate: serializeDate(model.endDate),
			budget: model.budget?.id ?? null,
		}),
	}),
	representationAllowances: (model: RepresentationAllowanceFormModel) => ({
		data: JSON.stringify({
			title: model.title,
			description: model.description,
			periodUnit: model.periodUnit,
			startDate: serializeDate(model.startDate),
			endDate: model.periodUnit === 'once' ? null : serializeDate(model.endDate),
			recipients: model.recipients.map((recipient) => ({
				ord: recipient.ord,
				person: recipient.person?.id ?? null,
				amount: recipient.amount,
			})),
		}),
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
