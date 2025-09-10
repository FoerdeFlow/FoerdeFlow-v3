import type {
	AttendanceStatusSelect,
	MembershipEndReasonSelect,
	MembershipTypeSelect,
	OrganizationItemSelect,
	PersonSelect,
	RoomSelect,

	KernCardNav,
	KernTaskList,
} from '#components'

export type AttendanceStatus = InstanceType<typeof AttendanceStatusSelect>['$props']['modelValue']
export type MembershipEndReason = InstanceType<typeof MembershipEndReasonSelect>['$props']['modelValue']
export type MembershipType = InstanceType<typeof MembershipTypeSelect>['$props']['modelValue']
export type OrganizationItem = InstanceType<typeof OrganizationItemSelect>['$props']['modelValue']
export type Person = InstanceType<typeof PersonSelect>['$props']['modelValue']
export type Room = InstanceType<typeof RoomSelect>['$props']['modelValue']

export type KernCardNavItems = InstanceType<typeof KernCardNav>['$props']['items']
export type KernTaskListItems = InstanceType<typeof KernTaskList>['$props']['items']
