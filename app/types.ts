import type {
	AttendanceStatusSelect,
	BudgetPlanItemSelect,
	BuildingSelect,
	GenderSelect,
	MembershipEndReasonSelect,
	MembershipTypeSelect,
	OrganizationItemSelect,
	OrganizationTypeSelect,
	PersonSelect,
	RoomSelect,
	WorkflowStepTypeSelect,

	KernCardNav,
	KernTaskList,
} from '#components'

export type AttendanceStatus = InstanceType<typeof AttendanceStatusSelect>['$props']['modelValue']
export type BudgetPlanItem = InstanceType<typeof BudgetPlanItemSelect>['$props']['modelValue']
export type Building = InstanceType<typeof BuildingSelect>['$props']['modelValue']
export type Gender = InstanceType<typeof GenderSelect>['$props']['modelValue']
export type MembershipEndReason = InstanceType<typeof MembershipEndReasonSelect>['$props']['modelValue']
export type MembershipType = InstanceType<typeof MembershipTypeSelect>['$props']['modelValue']
export type OrganizationItem = InstanceType<typeof OrganizationItemSelect>['$props']['modelValue']
export type OrganizationType = InstanceType<typeof OrganizationTypeSelect>['$props']['modelValue']
export type Person = InstanceType<typeof PersonSelect>['$props']['modelValue']
export type Room = InstanceType<typeof RoomSelect>['$props']['modelValue']
export type WorkflowStepType = InstanceType<typeof WorkflowStepTypeSelect>['$props']['modelValue']

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
