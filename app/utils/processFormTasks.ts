import type { Presets } from '#shared/utils/presets'
import type {
	BudgetPlanFormModel,
	ExpenseAuthorizationFormModel,
	KernTaskListItems,
	LongtermContractFormModel,
	PaymentOrderFormModel,
	RepresentationAllowanceFormModel,
	TravelAdvanceFormModel,
	TravelClaimFormModel,
	TravelPermitFormModel,
	WorkflowCustomBudgetPlanItemsFormModel,
	WorkflowCustomCandidateFormModel,
	WorkflowCustomPersonIbanFormModel,
} from '~/types'

type Tasks = KernTaskListItems[number]['tasks']

export interface ProcessFormTasks {
	title: string
	tasks: Tasks
}

function budgetPlanTasks(model: BudgetPlanFormModel, presets: Presets): Tasks {
	const itemsComplete = model.items.length > 0 &&
		model.items.every((item) => item.title) &&
		budgetPlanBalanced(model.items)

	return [
		...presetVisible(presets, 'budget', 'startDate', 'endDate')
			? [ {
				id: 'budget-plan-meta',
				label: 'Haushalt auswählen',
				status: model.budget || presetFixed(presets, 'budget') ? 'done' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'items')
			? [ {
				id: 'budget-plan-items',
				label: 'Haushaltstitel hinzufügen',
				status: presetFixed(presets, 'items') || itemsComplete
					? 'done'
					: model.items.length > 0
						? 'partial'
						: 'open',
			} ] satisfies Tasks
			: [],
	]
}

function budgetPlanItemsTasks(
	model: WorkflowCustomBudgetPlanItemsFormModel,
	presets: Presets,
): Tasks {
	const planSet = !!model.plan || presetFixed(presets, 'plan')
	const ords = model.items.map((item) => item.ord)
	const itemsComplete = model.items.length > 0 &&
		model.items.every((item) => item.title && item.ord) &&
		new Set(ords).size === ords.length &&
		budgetPlanBalanced(model.items)

	return [
		...presetVisible(presets, 'plan')
			? [ {
				id: 'budget-plan-items-plan',
				label: 'Haushaltsplan auswählen',
				status: planSet ? 'done' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'items')
			? [ {
				id: 'budget-plan-items-items',
				label: 'Haushaltstitel ändern',
				// The titles are loaded from the plan, so there is nothing to
				// change before one is picked.
				status: !planSet
					? 'blocked'
					: presetFixed(presets, 'items') || itemsComplete
						? 'done'
						: model.items.length > 0
							? 'partial'
							: 'open',
			} ] satisfies Tasks
			: [],
	]
}

/**
 * Reads the type of an expense authorization from the meta data of its
 * mutation.
 *
 * @param meta - The meta data of the mutation
 * @returns Whether the expense authorization is planned or taken from reserve
 */
export function expenseAuthorizationType(meta: unknown): 'planned' | 'reserve' {
	return typeof meta === 'object' && meta !== null && 'type' in meta && meta.type === 'reserve'
		? 'reserve'
		: 'planned'
}

/**
 * Reads from the meta data of a mutation whether an expense authorization may
 * be paid out of a budget plan that is still being applied for itself.
 *
 * @param meta - The meta data of the mutation
 * @returns Whether budget plans that are still being applied for may be picked
 */
export function expenseAuthorizationAllowsPendingBudgetPlan(meta: unknown): boolean {
	return typeof meta === 'object' && meta !== null &&
		'allowPendingBudgetPlan' in meta && meta.allowPendingBudgetPlan === true
}

function expenseAuthorizationTasks(
	model: ExpenseAuthorizationFormModel,
	presets: Presets,
	meta: unknown,
): Tasks {
	const type = expenseAuthorizationType(meta)
	const budgetField = type === 'planned' ? 'budgetPlanItem' : 'budget'
	const budgetFieldSet = presetFixed(presets, budgetField) || (type === 'planned'
		? !!model.budgetPlanItem
		: !!model.budget)

	return [
		...presetVisible(presets, budgetField)
			? [ {
				id: 'expense-authorization-plan-item',
				label: type === 'planned'
					? 'Haushaltstitel auswählen'
					: 'Haushalt auswählen',
				status: budgetFieldSet ? 'done' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'title', 'description')
			? [ {
				id: 'expense-authorization-title',
				label: 'Ausgabeermächtigung beschreiben',
				status: model.title || presetFixed(presets, 'title')
					? 'done'
					: model.description ? 'partial' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'items')
			? [ {
				id: 'expense-authorization-amount-and-items',
				label: 'Kostenaufstellung hinzufügen',
				status: model.amount !== 0 || presetFixed(presets, 'items') ? 'done' : 'open',
			} ] satisfies Tasks
			: [],
	]
}

function paymentOrderTasks(model: PaymentOrderFormModel, presets: Presets): Tasks {
	// Where the money comes from is part of the application itself, so the field
	// that has to be filled in follows the choice the applicant made.
	const budgetField = model.type === 'planned' ? 'budgetPlanItem' : 'budget'
	const budgetFieldSet = presetFixed(presets, budgetField) || (model.type === 'planned'
		? !!model.budgetPlanItem
		: !!model.budget)

	// The recipient is complete once the fields of the chosen kind are filled in.
	// An IBAN that was entered has to be a real one, otherwise the process would
	// be rejected when it is created.
	const recipientSet = model.recipientType === 'reimbursement'
		? !!model.recipientPerson || presetFixed(presets, 'recipientPerson')
		: !!model.recipientName &&
			isValidIban(model.recipientIban) &&
			!!model.purpose

	const recipientStarted = model.recipientType === 'reimbursement'
		? false
		: !!model.recipientName || !!model.recipientIban || !!model.purpose

	return [
		...presetVisible(presets, 'type', budgetField, 'expenseAuthorization')
			? [ {
				id: 'payment-order-source',
				label: 'Herkunft der Mittel auswählen',
				status: budgetFieldSet ? 'done' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(
			presets,
			'recipientType',
			'recipientPerson',
			'recipientName',
			'recipientIban',
			'purpose',
		)
			? [ {
				id: 'payment-order-recipient',
				label: 'Empfänger*in angeben',
				status: recipientSet
					? 'done'
					: recipientStarted ? 'partial' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'title', 'description')
			? [ {
				id: 'payment-order-title',
				label: 'Zahlungsanweisung beschreiben',
				status: model.title || presetFixed(presets, 'title')
					? 'done'
					: model.description ? 'partial' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'amount')
			? [ {
				id: 'payment-order-amount',
				label: 'Betrag angeben',
				status: model.amount > 0 || presetFixed(presets, 'amount') ? 'done' : 'open',
			} ] satisfies Tasks
			: [],
	]
}

function longtermContractTasks(model: LongtermContractFormModel, presets: Presets): Tasks {
	const titleSet = !!model.title || presetFixed(presets, 'title')
	const startDateSet = !!model.startDate || presetFixed(presets, 'startDate')

	return [
		...presetVisible(presets, 'budget')
			? [ {
				id: 'longterm-contract-budget',
				label: 'Haushalt auswählen',
				status: model.budget || presetFixed(presets, 'budget') ? 'done' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'title', 'description', 'startDate', 'endDate')
			? [ {
				id: 'longterm-contract-title',
				label: 'Langzeitvertrag beschreiben',
				status: titleSet && startDateSet
					? 'done'
					: titleSet || startDateSet || model.description
						? 'partial'
						: 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'items')
			? [ {
				id: 'longterm-contract-items',
				label: 'Kostenaufstellung hinzufügen',
				status: model.items.length > 0 || presetFixed(presets, 'items') ? 'done' : 'open',
			} ] satisfies Tasks
			: [],
	]
}

function representationAllowanceTasks(
	model: RepresentationAllowanceFormModel,
	presets: Presets,
	meta: unknown,
): Tasks {
	const titleSet = !!model.title || presetFixed(presets, 'title')
	const startDateSet = !!model.startDate || presetFixed(presets, 'startDate')
	const { violated } = representationAllowanceLimits(model, meta)

	return [
		...presetVisible(presets, 'title', 'description', 'periodUnit', 'startDate', 'endDate')
			? [ {
				id: 'representation-allowance-title',
				label: 'Aufwandsentschädigung beschreiben',
				status: titleSet && startDateSet
					? 'done'
					: titleSet || startDateSet || model.description
						? 'partial'
						: 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'recipients')
			? [ {
				id: 'representation-allowance-recipients',
				label: 'Empfänger*innen hinzufügen',
				status: violated
					? 'partial'
					: presetFixed(presets, 'recipients') ||
						(model.recipients.length > 0 && model.recipients
							.every((recipient) => recipient.person && recipient.amount > 0))
						? 'done'
						: model.recipients.length > 0
							? 'partial'
							: 'open',
			} ] satisfies Tasks
			: [],
	]
}

function travelPermitTasks(
	model: TravelPermitFormModel,
	presets: Presets,
	meta: unknown,
): Tasks {
	const filled = (field: keyof TravelPermitFormModel) =>
		!!model[field] || presetFixed(presets, field)

	const rules = travelPermitMeta(meta)
	const roleAllowed = !rules.roles || (!!model.role && rules.roles.includes(model.role.code))
	const allocationAllowed = !rules.specialAllocations ||
		(!!model.specialAllocation && rules.specialAllocations.includes(model.specialAllocation.code))
	const travelerComplete = filled('traveler') && filled('role') && roleAllowed && allocationAllowed

	const startDate = model.startDate instanceof Date ? serializeDate(model.startDate) : model.startDate
	const endDate = model.endDate instanceof Date ? serializeDate(model.endDate) : model.endDate
	const journeyComplete = filled('title') && filled('origin') && filled('destination') &&
		!!startDate && !!endDate && endDate >= startDate
	const journeyStarted = !!model.title || !!model.origin || !!model.destination || !!startDate

	const reasonRequired = !!model.transportMode?.reasonRequired
	// A reason restricted to certain roles no longer fits once the role changes.
	const reason = model.transportReason
	const reasonFits = !reason || reason.roles.length === 0 ||
		reason.roles.some((role) => role.id === model.role?.id)
	const transportComplete = filled('transportMode') &&
		(!reasonRequired || filled('transportReason')) && reasonFits

	// The title has to be one of the plan in force when the journey starts, of
	// the budget the role or the special allocation names.
	const budget = model.specialAllocation?.budget ?? model.role?.budget ?? null
	const item = model.budgetPlanItem
	const itemFits = !!item && item.plan.budget.id === budget?.id && !!startDate &&
		item.plan.startDate <= startDate && startDate <= item.plan.endDate
	const budgetComplete = model.type === 'reserve' || itemFits || presetFixed(presets, 'budgetPlanItem')

	const violations = travelPermitViolations(
		model.items.map((entry) => ({ costType: entry.costType?.code ?? null, amount: entry.amount })),
		meta,
	)
	const itemsComplete = model.items.length > 0 && violations.length === 0 &&
		model.items.every((entry) => entry.costType && entry.amount > 0)

	return [
		...presetVisible(presets, 'traveler', 'role', 'specialAllocation')
			? [ {
				id: 'travel-permit-traveler',
				label: 'Reisende*n und Rolle angeben',
				status: travelerComplete ? 'done' : model.role ? 'partial' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'title', 'description', 'origin', 'destination', 'startDate', 'endDate')
			? [ {
				id: 'travel-permit-journey',
				label: 'Dienstreise beschreiben',
				status: journeyComplete ? 'done' : journeyStarted ? 'partial' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'transportMode', 'transportReason')
			? [ {
				id: 'travel-permit-transport',
				label: 'Verkehrsmittel angeben',
				status: transportComplete ? 'done' : model.transportMode ? 'partial' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'type', 'budgetPlanItem')
			? [ {
				id: 'travel-permit-budget',
				label: 'Haushaltstitel auswählen',
				status: !model.role || !startDate
					? 'blocked'
					: budgetComplete ? 'done' : item ? 'partial' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'items')
			? [ {
				id: 'travel-permit-items',
				label: 'Kosten aufstellen',
				status: itemsComplete || presetFixed(presets, 'items')
					? 'done'
					: model.items.length > 0 ? 'partial' : 'open',
			} ] satisfies Tasks
			: [],
	]
}

function travelAdvanceTasks(
	model: TravelAdvanceFormModel,
	presets: Presets,
	meta: unknown,
): Tasks {
	const maximumAmount = model.permit ? travelAdvanceMaximum(model.permit.amount, meta) : 0

	return presetVisible(presets, 'permit', 'amount')
		? [ {
			id: 'travel-advance',
			label: 'Vorschuss beantragen',
			status: model.permit && model.amount > 0 && model.amount <= maximumAmount
				? 'done'
				: model.permit ? 'partial' : 'open',
		} ]
		: []
}

function travelClaimTasks(model: TravelClaimFormModel, presets: Presets): Tasks {
	const known = new Set(model.permit?.items.map((item) => item.id) ?? [])
	const itemsComplete = model.items.length > 0 && model.items
		.every((item) => item.permitItem && known.has(item.permitItem) && item.amount > 0)

	return [
		...presetVisible(presets, 'permit')
			? [ {
				id: 'travel-claim-permit',
				label: 'Dienstreise auswählen',
				status: model.permit || presetFixed(presets, 'permit') ? 'done' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'items')
			? [ {
				id: 'travel-claim-items',
				label: 'Tatsächliche Kosten angeben',
				status: !model.permit
					? 'blocked'
					: itemsComplete ? 'done' : model.items.length > 0 ? 'partial' : 'open',
			} ] satisfies Tasks
			: [],
	]
}

function workflowCustomCandidateTasks(
	model: WorkflowCustomCandidateFormModel,
	presets: Presets,
): Tasks {
	const candidateSet = !!model.candidate || presetFixed(presets, 'candidate')
	const personDataSet =
		(!!model.matriculationNumber || presetFixed(presets, 'matriculationNumber')) &&
		(!!model.course || presetFixed(presets, 'course')) &&
		(!!model.postalAddress || presetFixed(presets, 'postalAddress'))

	return [
		...presetVisible(presets, 'electionCommittee')
			? [ {
				id: 'candidate-election-committee',
				label: 'Wahl und Gremium auswählen',
				status: model.electionCommittee || presetFixed(presets, 'electionCommittee')
					? 'done'
					: 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'candidate')
			? [ {
				id: 'candidate-candidate',
				label: 'Kandidat*in auswählen',
				status: candidateSet ? 'done' : 'open',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'matriculationNumber', 'course', 'postalAddress', 'callName', 'pronouns')
			? [ {
				id: 'candidate-person',
				label: 'Persönliche Daten erfassen',
				status: candidateSet
					? personDataSet
						? 'done'
						: 'open'
					: 'blocked',
			} ] satisfies Tasks
			: [],
		{
			id: 'candidate-photo',
			label: 'Lichtbild erfassen',
			status: candidateSet
				? model.photo ? 'done' : 'open'
				: 'blocked',
		},
		...presetVisible(presets, 'applicationLetter')
			? [ {
				id: 'candidate-application-letter',
				label: 'Beschreibung erfassen',
				status: candidateSet
					? model.applicationLetter || presetFixed(presets, 'applicationLetter')
						? 'done'
						: 'open'
					: 'blocked',
			} ] satisfies Tasks
			: [],
	]
}

function workflowCustomPersonTasks(presets: Presets): Tasks {
	// Every field a person may adjust about themselves is optional, so neither
	// step can ever be incomplete: leaving a field empty is a valid answer.
	// The steps stay in the list so that they can be opened and reviewed.
	return [
		...presetVisible(presets, 'callName', 'pronouns', 'gender')
			? [ {
				id: 'person-name',
				label: 'Namen und Pronomen angeben',
				status: 'done',
			} ] satisfies Tasks
			: [],
		...presetVisible(presets, 'matriculationNumber', 'course', 'postalAddress')
			? [ {
				id: 'person-contact',
				label: 'Matrikelnummer, Studiengang und Anschrift angeben',
				status: 'done',
			} ] satisfies Tasks
			: [],
	]
}

function workflowCustomPersonIbanTasks(model: WorkflowCustomPersonIbanFormModel): Tasks {
	// The bank details are optional, so an empty field is a valid answer. An
	// IBAN that was entered has to be a real one though, otherwise the process
	// would be rejected when it is created.
	return [ {
		id: 'person-iban',
		label: 'Bankverbindung angeben',
		status: normalizeIban(model.iban) === '' || isValidIban(model.iban)
			? 'done'
			: 'partial',
	} ]
}

function workflowCustomPersonPhotoTasks(): Tasks {
	// Handing in no photo means that the current one stays in place, so this
	// step is never incomplete either.
	return [ {
		id: 'person-photo',
		label: 'Lichtbild erfassen',
		status: 'done',
	} ]
}

/**
 * Builds the tasks a mutation of a process contributes to the task list of its
 * initiator.
 *
 * The tasks are derived from the model alone, so that they are known without
 * rendering the form of the mutation.
 *
 * @param table - The table the mutation writes to
 * @param model - The model of the form of the mutation
 * @param presets - The presets of the mutation, resolved by the API
 * @param meta - The meta data of the mutation
 * @returns The title and the tasks of the form or `null` if there is no form
 */
export function processFormTasks(
	table: string,
	model: unknown,
	presets: unknown,
	meta?: unknown,
): ProcessFormTasks | null {
	const parsed = parsePresets(presets)

	switch(table) {
		case 'budgetPlans':
			return {
				title: 'Details zum Haushaltsplan',
				tasks: budgetPlanTasks(model as BudgetPlanFormModel, parsed),
			}
		case 'budgetPlanItems':
			return {
				title: 'Änderung der Haushaltstitel',
				tasks: budgetPlanItemsTasks(
					model as WorkflowCustomBudgetPlanItemsFormModel,
					parsed,
				),
			}
		case 'expenseAuthorizations':
			return {
				title: 'Details zur Ausgabeermächtigung',
				tasks: expenseAuthorizationTasks(
					model as ExpenseAuthorizationFormModel,
					parsed,
					meta,
				),
			}
		case 'paymentOrders':
			return {
				title: 'Details zur Zahlungsanweisung',
				tasks: paymentOrderTasks(model as PaymentOrderFormModel, parsed),
			}
		case 'longtermContracts':
			return {
				title: 'Details zum Langzeitvertrag',
				tasks: longtermContractTasks(model as LongtermContractFormModel, parsed),
			}
		case 'representationAllowances':
			return {
				title: 'Details zur Aufwandsentschädigung',
				tasks: representationAllowanceTasks(
					model as RepresentationAllowanceFormModel,
					parsed,
					meta,
				),
			}
		case 'travelPermits':
			return {
				title: 'Details zur Dienstreisegenehmigung',
				tasks: travelPermitTasks(model as TravelPermitFormModel, parsed, meta),
			}
		case 'travelAdvances':
			return {
				title: 'Details zum Vorschuss',
				tasks: travelAdvanceTasks(model as TravelAdvanceFormModel, parsed, meta),
			}
		case 'travelClaims':
			return {
				title: 'Details zur Reisekostenerstattung',
				tasks: travelClaimTasks(model as TravelClaimFormModel, parsed),
			}
		case 'candidates':
			return {
				title: 'Daten zur Kandidatur',
				tasks: workflowCustomCandidateTasks(model as WorkflowCustomCandidateFormModel, parsed),
			}
		case 'persons':
			return {
				title: 'Eigene Daten',
				tasks: workflowCustomPersonTasks(parsed),
			}
		case 'personIbans':
			return {
				title: 'Eigene Bankverbindung',
				tasks: workflowCustomPersonIbanTasks(model as WorkflowCustomPersonIbanFormModel),
			}
		case 'personPhotos':
			return {
				title: 'Eigenes Lichtbild',
				tasks: workflowCustomPersonPhotoTasks(),
			}
		default:
			return null
	}
}
