import type {
	BudgetPlanFormModel,
	ExpenseAuthorizationFormModel,
	LongtermContractFormModel,
	PaymentOrderFormModel,
	RepresentationAllowanceFormModel,
	TravelClaimFormModel,
	TravelPermitFormModel,
	WorkflowCustomBudgetPlanItemsFormModel,
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
	budgetPlanItems: (model: WorkflowCustomBudgetPlanItemsFormModel) => ({
		// The budget only narrows down the plans to pick from, and the titles as
		// they stood are read from the plan by the server, so neither travels.
		data: JSON.stringify({
			plan: model.plan?.id ?? null,
			// A title that was added in this session is identified by a symbol,
			// which the server reads as a title that does not exist yet.
			items: model.items.map((item) => ({
				id: typeof item.id === 'string' ? item.id : null,
				ord: item.ord,
				title: item.title,
				description: item.description,
				revenues: item.revenues,
				expenses: item.expenses,
			})),
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
	travelPermits: (model: TravelPermitFormModel) => {
		// Only the fields of the chosen origin and of the chosen car travel, the
		// table accepts only one set of each at a time.
		const planned = model.type === 'planned'
		const car = model.car !== 'none'

		return {
			data: JSON.stringify({
				kind: model.kind,
				type: model.type,
				budgetPlanItem: planned ? model.budgetPlanItem?.id ?? null : null,
				budget: planned ? null : model.budget?.id ?? null,
				title: model.title,
				description: model.description,
				destination: model.destination,
				domestic: model.domestic,
				startDate: serializeDate(model.startDate),
				endDate: serializeDate(model.endDate),
				occasion: model.occasion,
				travelerBasis: model.travelerBasis,
				specialInterest: model.specialInterest,
				specialInterestReference: model.specialInterest === 'parliamentDecision'
					? model.specialInterestReference
					: null,
				longDistance: model.longDistance,
				car: model.car,
				carInterestReason: car ? model.carInterestReason : null,
				parkingFeesAllowed: car && model.parkingFeesAllowed,
				carsharingEstimate: model.car === 'carsharing' ? model.carsharingEstimate ?? 0 : null,
				advanceAmount: model.kind === 'single' && model.advanceAmount
					? model.advanceAmount
					: null,
				travelers: model.travelers.map((traveler) => ({
					ord: traveler.ord,
					person: traveler.person?.id ?? null,
					amount: traveler.amount,
					driver: model.car === 'carsharing' && traveler.driver,
				})),
			}),
		}
	},
	travelClaims: (model: TravelClaimFormModel) => {
		const general = model.permit?.kind === 'general'
		const items = model.items.map((item) => ({
			item,
			files: Array.isArray(item.receipts)
				? item.receipts.filter((file) => file instanceof File)
				: [],
		}))

		return {
			data: JSON.stringify({
				permit: model.permit?.id ?? null,
				recipientPerson: model.recipientPerson,
				title: general ? model.title : null,
				destination: general ? model.destination : null,
				startDate: serializeDate(model.startDate),
				endDate: serializeDate(model.endDate),
				items: items.map(({ item, files }) => ({
					ord: item.ord,
					traveler: item.traveler,
					category: item.category,
					description: item.description,
					amount: item.amount,
					kilometers: item.kilometers,
					event: item.event,
					receipts: files.length,
				})),
			}),
			// Each receipt travels as an attachment of its own, named after the
			// item it belongs to, the way the server expects it.
			...Object.fromEntries(items.flatMap(({ item, files }) => files.map((file, index) => [
				`attachment_receipt_${item.ord}_${index}`,
				file,
			]))),
		}
	},
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
