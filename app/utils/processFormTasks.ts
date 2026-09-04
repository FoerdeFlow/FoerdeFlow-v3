import type { Presets } from '#shared/utils/presets'
import type {
	BudgetPlanFormModel,
	ExpenseAuthorizationFormModel,
	KernTaskListItems,
	LongtermContractFormModel,
	RepresentationAllowanceFormModel,
	WorkflowCustomCandidateFormModel,
} from '~/types'

type Tasks = KernTaskListItems[number]['tasks']

export interface ProcessFormTasks {
	title: string
	tasks: Tasks
}

function budgetPlanTasks(model: BudgetPlanFormModel, presets: Presets): Tasks {
	const itemsComplete = model.items.length > 0 &&
		model.items.every((item) => item.title) &&
		model.items.reduce(
			(sum, item) => sum + (item.revenues ?? 0) - (item.expenses ?? 0),
			0,
		) === 0

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
		case 'expenseAuthorizations':
			return {
				title: 'Details zur Ausgabeermächtigung',
				tasks: expenseAuthorizationTasks(
					model as ExpenseAuthorizationFormModel,
					parsed,
					meta,
				),
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
		case 'candidates':
			return {
				title: 'Daten zur Kandidatur',
				tasks: workflowCustomCandidateTasks(model as WorkflowCustomCandidateFormModel, parsed),
			}
		default:
			return null
	}
}
