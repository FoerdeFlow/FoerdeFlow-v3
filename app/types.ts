import type {
	AttendanceStatusSelect,
	BudgetPeriodTypeSelect,
	BudgetPlanItemSelect,
	BudgetPlanSelect,
	BudgetSelect,
	BuildingSelect,
	CouncilSelect,
	CourseSelect,
	CourseTypeSelect,
	DepartmentSelect,
	DocumentTypeSelect,
	ElectionCommitteeSelect,
	ElectionSelect,
	GenderSelect,
	KernCardNav,
	KernTaskList,
	MembershipEndReasonSelect,
	MembershipTypeSelect,
	OrganizationItemSelect,
	OrganizationTypeSelect,
	PersonSelect,
	RoleSelect,
	RoomSelect,
	SessionSelect,
	WorkflowStepTypeSelect,
} from '#components'

export type AttendanceStatus = InstanceType<typeof AttendanceStatusSelect>['$props']['modelValue']
export type Budget = InstanceType<typeof BudgetSelect>['$props']['modelValue']
export type BudgetPeriodType = InstanceType<typeof BudgetPeriodTypeSelect>['$props']['modelValue']
export type BudgetPlan = InstanceType<typeof BudgetPlanSelect>['$props']['modelValue']
export type BudgetPlanItem = InstanceType<typeof BudgetPlanItemSelect>['$props']['modelValue']
export type Building = InstanceType<typeof BuildingSelect>['$props']['modelValue']
export type Council = InstanceType<typeof CouncilSelect>['$props']['modelValue']
export type Course = InstanceType<typeof CourseSelect>['$props']['modelValue']
export type CourseType = InstanceType<typeof CourseTypeSelect>['$props']['modelValue']
export type Department = InstanceType<typeof DepartmentSelect>['$props']['modelValue']
export type DocumentType = InstanceType<typeof DocumentTypeSelect>['$props']['modelValue']
export type Election = InstanceType<typeof ElectionSelect>['$props']['modelValue']
export type ElectionCommittee = InstanceType<typeof ElectionCommitteeSelect>['$props']['modelValue']
export type Gender = InstanceType<typeof GenderSelect>['$props']['modelValue']
export type MembershipEndReason = InstanceType<typeof MembershipEndReasonSelect>['$props']['modelValue']
export type MembershipType = InstanceType<typeof MembershipTypeSelect>['$props']['modelValue']
export type OrganizationItem = InstanceType<typeof OrganizationItemSelect>['$props']['modelValue']
export type OrganizationType = InstanceType<typeof OrganizationTypeSelect>['$props']['modelValue']
export type Person = InstanceType<typeof PersonSelect>['$props']['modelValue']
export type Role = InstanceType<typeof RoleSelect>['$props']['modelValue']
export type Room = InstanceType<typeof RoomSelect>['$props']['modelValue']
export type Session = InstanceType<typeof SessionSelect>['$props']['modelValue']
export type WorkflowStepType = InstanceType<typeof WorkflowStepTypeSelect>['$props']['modelValue']

export interface BudgetPlanFormModel {
	budget: Budget
	startDate: Date | null
	endDate: Date | null
	items: BudgetPlanItemInput[]
}

export interface ExpenseAuthorizationFormModel {
	budgetPlanItem: BudgetPlanItem
	budget: Budget
	title: string
	description: string | null
	amount: number
	items: ExpenseAuthorizationItemInput[]
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
