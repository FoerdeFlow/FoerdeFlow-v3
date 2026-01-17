import type {
	AttendanceStatusSelect,
	BudgetSelect,
	BudgetPlanSelect,
	BudgetPlanItemSelect,
	BuildingSelect,
	CouncilSelect,
	CourseSelect,
	CourseTypeSelect,
	DepartmentSelect,
	DocumentTypeSelect,
	ExpenseAuthorizationForm,
	GenderSelect,
	MembershipEndReasonSelect,
	MembershipTypeSelect,
	OrganizationItemSelect,
	OrganizationTypeSelect,
	PersonSelect,
	RoleSelect,
	RoomSelect,
	SessionSelect,
	WorkflowStepTypeSelect,

	KernCardNav,
	KernTaskList,
} from '#components'

export type AttendanceStatus = InstanceType<typeof AttendanceStatusSelect>['$props']['modelValue']
export type Budget = InstanceType<typeof BudgetSelect>['$props']['modelValue']
export type BudgetPlan = InstanceType<typeof BudgetPlanSelect>['$props']['modelValue']
export type BudgetPlanItem = InstanceType<typeof BudgetPlanItemSelect>['$props']['modelValue']
export type Building = InstanceType<typeof BuildingSelect>['$props']['modelValue']
export type Council = InstanceType<typeof CouncilSelect>['$props']['modelValue']
export type Course = InstanceType<typeof CourseSelect>['$props']['modelValue']
export type CourseType = InstanceType<typeof CourseTypeSelect>['$props']['modelValue']
export type Department = InstanceType<typeof DepartmentSelect>['$props']['modelValue']
export type DocumentType = InstanceType<typeof DocumentTypeSelect>['$props']['modelValue']
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

export type ExpenseAuthorizationFormModel = InstanceType<typeof ExpenseAuthorizationForm>['$props']['modelValue']

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
	title: string
	description: string
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
