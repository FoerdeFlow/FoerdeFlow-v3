import type { InternalApi } from 'nitropack'

import type {
	AttendanceStatusSelect,
	BudgetPeriodTypeSelect,
	BudgetPlanItemSelect,
	BudgetPlanSelect,
	BudgetSelect,
	CouncilSelect,
	CourseSelect,
	CourseTypeSelect,
	DepartmentSelect,
	DocumentTypeSelect,
	ElectionCommitteeSelect,
	ElectionSelect,
	EventTypeSelect,
	ExpenseAuthorizationSelect,
	GenderSelect,
	InventoryItemSelect,
	KernCardNav,
	KernTaskList,
	LocationSelect,
	MembershipEndReasonSelect,
	MembershipTypeSelect,
	OrganizationItemSelect,
	OrganizationTypeSelect,
	PersonSelect,
	RoleSelect,
	SessionSelect,
	TravelCostTypeSelect,
	TravelRoleSelect,
	TravelSpecialAllocationSelect,
	TravelTransportModeSelect,
	TravelTransportReasonSelect,
	WorkflowStepTypeSelect,
} from '#components'
import type { DestructureArray } from '#shared/types'

export type AttendanceStatus = InstanceType<typeof AttendanceStatusSelect>['$props']['modelValue']
export type Budget = InstanceType<typeof BudgetSelect>['$props']['modelValue']
export type BudgetPeriodType = InstanceType<typeof BudgetPeriodTypeSelect>['$props']['modelValue']
export type BudgetPlan = InstanceType<typeof BudgetPlanSelect>['$props']['modelValue']
/**
 * A budget plan that is still being applied for and has no rows yet. Taken from
 * the API rather than from the select, so that it stays a real type outside of
 * the single-file components.
 */
export type PendingBudgetPlan = DestructureArray<InternalApi['/api/pendingBudgetPlans']['get']>
export type BudgetPlanItem = InstanceType<typeof BudgetPlanItemSelect>['$props']['modelValue']
export type Council = InstanceType<typeof CouncilSelect>['$props']['modelValue']
export type Course = InstanceType<typeof CourseSelect>['$props']['modelValue']
export type CourseType = InstanceType<typeof CourseTypeSelect>['$props']['modelValue']
export type Department = InstanceType<typeof DepartmentSelect>['$props']['modelValue']
export type DocumentType = InstanceType<typeof DocumentTypeSelect>['$props']['modelValue']
export type Election = InstanceType<typeof ElectionSelect>['$props']['modelValue']
export type ElectionCommittee = InstanceType<typeof ElectionCommitteeSelect>['$props']['modelValue']
/**
 * An event. The name avoids `Event`, which belongs to the DOM and would be
 * shadowed in every file that imports this one. Taken from the API rather than
 * from a select, because nothing references an event.
 */
export type CalendarEvent = DestructureArray<InternalApi['/api/events']['get']>
export type EventType = InstanceType<typeof EventTypeSelect>['$props']['modelValue']
export type ExpenseAuthorization = InstanceType<typeof ExpenseAuthorizationSelect>['$props']['modelValue']
export type Gender = InstanceType<typeof GenderSelect>['$props']['modelValue']
export type InventoryItem = InstanceType<typeof InventoryItemSelect>['$props']['modelValue']
/**
 * A loan of an inventory item. Taken from the API rather than from a select,
 * because nothing picks a loan from a list.
 */
export type InventoryLoan = DestructureArray<InternalApi['/api/inventoryLoans']['get']>
/**
 * A place a session or an event is held at. The name shadows the DOM global of
 * the same name, which nothing in a single-file component reaches for.
 */
export type Location = InstanceType<typeof LocationSelect>['$props']['modelValue']
export type LocationType = NonNullable<Location>['type']
export type MembershipEndReason = InstanceType<typeof MembershipEndReasonSelect>['$props']['modelValue']
export type MembershipType = InstanceType<typeof MembershipTypeSelect>['$props']['modelValue']
export type OrganizationItem = InstanceType<typeof OrganizationItemSelect>['$props']['modelValue']
export type OrganizationType = InstanceType<typeof OrganizationTypeSelect>['$props']['modelValue']
export type Person = InstanceType<typeof PersonSelect>['$props']['modelValue']
export type Role = InstanceType<typeof RoleSelect>['$props']['modelValue']
export type Session = InstanceType<typeof SessionSelect>['$props']['modelValue']
export type TravelCostType = InstanceType<typeof TravelCostTypeSelect>['$props']['modelValue']
export type TravelRole = InstanceType<typeof TravelRoleSelect>['$props']['modelValue']
export type TravelSpecialAllocation = InstanceType<typeof TravelSpecialAllocationSelect>['$props']['modelValue']
export type TravelTransportMode = InstanceType<typeof TravelTransportModeSelect>['$props']['modelValue']
export type TravelTransportReason = InstanceType<typeof TravelTransportReasonSelect>['$props']['modelValue']
export type WorkflowStepType = InstanceType<typeof WorkflowStepTypeSelect>['$props']['modelValue']

/**
 * A unit as the organisation chart draws it. The chart takes its children from
 * the node itself, so a caller can hand in a cut-out of the tree as well.
 */
export interface OrganizationChartNode {
	id: string
	code: string
	name: string
	organizationType: { name: string }
	/** Whether the unit or one above it is dissolved; only those who manage units see these. */
	inactive?: boolean
	children: OrganizationChartNode[]
}

export interface BudgetPlanFormModel {
	budget: Budget
	startDate: Date | null
	endDate: Date | null
	items: BudgetPlanItemInput[]
}

/**
 * The titles of an existing budget plan, changed through a workflow. It has a
 * form of its own for the same reason the IBAN of a person has one: the process
 * system is keyed by the table of a mutation, not by its action.
 */
export interface WorkflowCustomBudgetPlanItemsFormModel {
	budget: Budget
	plan: BudgetPlan
	items: BudgetPlanItemInput[]
	/**
	 * The titles as they stood when the process was created. Only a stored
	 * mutation carries them, the form loads them from the plan instead.
	 */
	previous?: { items: BudgetPlanItemInput[] } | null
}

export interface ExpenseAuthorizationFormModel {
	budgetPlanItem: BudgetPlanItem
	budget: Budget
	title: string
	description: string | null
	amount: number
	items: ExpenseAuthorizationItemInput[]
}

/** A title a journey may be paid from, as the travel API offers it. */
export type TravelPermitBudgetPlanItem =
	DestructureArray<InternalApi['/api/travelPermits/budgetPlanItems']['get']> | null

/** A permit of the user, with its lines and what was paid on it so far. */
export type TravelPermitSummary = DestructureArray<InternalApi['/api/travelPermits']['get']>

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TravelPermitItemInput = {
	id: string | symbol | null
	ord: number | null
	costType: TravelCostType
	description: string | null
	amount: number
}

export interface TravelPermitFormModel {
	traveler: Person
	role: TravelRole
	specialAllocation: TravelSpecialAllocation
	title: string
	description: string | null
	origin: string
	destination: string
	startDate: Date | null
	endDate: Date | null
	transportMode: TravelTransportMode
	transportReason: TravelTransportReason
	type: PaymentOrderType
	budgetPlanItem: TravelPermitBudgetPlanItem
	items: TravelPermitItemInput[]
}

export interface TravelAdvanceFormModel {
	permit: TravelPermitSummary | null
	amount: number
}

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TravelClaimItemInput = {
	id: string | symbol | null
	ord: number | null
	permitItem: string | null
	description: string | null
	amount: number
}

export interface TravelClaimFormModel {
	permit: TravelPermitSummary | null
	items: TravelClaimItemInput[]
}

export interface PaymentOrderFormModel {
	type: PaymentOrderType
	budgetPlanItem: BudgetPlanItem
	budget: Budget
	expenseAuthorization: ExpenseAuthorization
	recipientType: PaymentOrderRecipientType
	recipientPerson: Person
	recipientName: string | null
	recipientIban: string | null
	purpose: string | null
	title: string
	description: string | null
	amount: number
}

export interface LongtermContractFormModel {
	budget: Budget
	title: string
	description: string | null
	startDate: Date | null
	endDate: Date | null
	items: LongtermContractItemInput[]
}

export interface RepresentationAllowanceFormModel {
	title: string
	description: string | null
	periodUnit: RepresentationAllowancePeriodUnit
	startDate: Date | null
	endDate: Date | null
	recipients: RepresentationAllowanceRecipientInput[]
}

/** The data a person may adjust about themselves. */
export interface WorkflowCustomPersonFormModel {
	callName: string | null
	pronouns: string | null
	gender: Gender
	matriculationNumber: number | null
	course: Course
	postalAddress: string | null
}

/**
 * The bank details of a person. Its own form for the same reason the photo has
 * one: a workflow can have it approved apart from the rest.
 */
export interface WorkflowCustomPersonIbanFormModel {
	iban: string | null
}

/**
 * The photo of a person. It is its own form, because it is its own mutation:
 * a workflow can have the photo approved separately from the other data.
 */
export interface WorkflowCustomPersonPhotoFormModel {
	photo: File | null
}

export interface WorkflowCustomCandidateFormModel {
	electionCommittee: ElectionCommittee
	candidate: Person
	applicationLetter: string | null
	callName: string | null
	pronouns: string | null
	matriculationNumber: number | null
	course: Course
	postalAddress: string
	photo: File | null
}

export type KernCardNavItems = InstanceType<typeof KernCardNav>['$props']['items']
export type KernTaskListItems = InstanceType<typeof KernTaskList>['$props']['items']

interface PermissionNotNull {
	id: string
	scope: 'global' | 'organizationItem'
	assignable: boolean
}
export type Permission = PermissionNotNull | null

export interface Scope {
	organizationItem: string
}

export interface BudgetPlanItemInput {
	id: string | symbol | null
	ord: number | null
	title: string
	description: string | null
	revenues: number | null
	expenses: number | null
}

export interface ExpenseAuthorizationItemInput {
	id: string | symbol | null
	ord: number | null
	title: string
	description: string | null
	amount: number
}

export type PaymentOrderType = 'planned' | 'reserve'
export type PaymentOrderRecipientType = 'reimbursement' | 'invoice'

export type LongtermContractItemType = 'time' | 'usage' | 'fixed'
export type LongtermContractTimeUnit = 'month' | 'quarter' | 'semester' | 'year'

export interface LongtermContractItemInput {
	id: string | symbol | null
	ord: number | null
	type: LongtermContractItemType
	title: string
	description: string | null
	amount: number
	timeUnit: LongtermContractTimeUnit | null
	usageUnit: string | null
	expectedUsage: number | null
}

export type RepresentationAllowancePeriodUnit = 'month' | 'once'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type RepresentationAllowanceRecipientInput = {
	id: string | symbol | null
	ord: number | null
	person: Person
	amount: number
}
