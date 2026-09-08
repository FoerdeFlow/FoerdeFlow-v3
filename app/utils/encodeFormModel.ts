import type {
	BudgetPlanFormModel,
	ExpenseAuthorizationFormModel,
	LongtermContractFormModel,
	PaymentOrderFormModel,
	RepresentationAllowanceFormModel,
	WorkflowCustomCandidateFormModel,
	WorkflowCustomPersonFormModel,
	WorkflowCustomPersonIbanFormModel,
	WorkflowCustomPersonPhotoFormModel,
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
	expenseAuthorizations: (model: ExpenseAuthorizationFormModel) => {
		// A budget plan that is still being applied for has no rows yet, so its
		// item is referenced by the process it is applied for in.
		const pending = model.budgetPlanItem && 'pending' in model.budgetPlanItem
			? model.budgetPlanItem
			: null

		return {
			data: JSON.stringify({
				...model,
				budgetPlanItem: pending ? null : model.budgetPlanItem?.id ?? null,
				pendingBudgetPlanItem: pending
					? { process: pending.process, ord: pending.ord }
					: null,
				budget: model.budget?.id ?? null,
			}),
		}
	},
	paymentOrders: (model: PaymentOrderFormModel) => {
		// Only the fields of the chosen origin and of the chosen kind of recipient
		// travel, the others are cleared: the table only accepts one set of each
		// at a time.
		const planned = model.type === 'planned'
		const reimbursement = model.recipientType === 'reimbursement'

		return {
			data: JSON.stringify({
				...model,
				budgetPlanItem: planned ? model.budgetPlanItem?.id ?? null : null,
				budget: planned ? null : model.budget?.id ?? null,
				expenseAuthorization: model.expenseAuthorization?.id ?? null,
				recipientPerson: reimbursement ? model.recipientPerson?.id ?? null : null,
				recipientName: reimbursement ? null : model.recipientName,
				// Stored without its spaces, the server checks it once more anyway.
				recipientIban: reimbursement ? null : normalizeIban(model.recipientIban) || null,
				purpose: reimbursement ? null : model.purpose,
			}),
		}
	},
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
	persons: (model: WorkflowCustomPersonFormModel) => ({
		data: JSON.stringify({
			...model,
			course: model.course?.id ?? null,
		}),
	}),
	personIbans: (model: WorkflowCustomPersonIbanFormModel) => ({
		data: JSON.stringify({
			// Stored without its spaces, the server checks it once more anyway.
			iban: normalizeIban(model.iban) || null,
		}),
	}),
	personPhotos: (model: WorkflowCustomPersonPhotoFormModel) => ({
		// Whose photo it is follows from the initiator, so the mutation itself
		// only carries the file. Without a new photo the attachment is left out
		// entirely, which the process reads as "keep the current one".
		data: JSON.stringify({}),
		...model.photo instanceof File ? { attachment_photo: model.photo } : {},
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
