import type {
	MembershipTypeSelect,
	OrganizationItemSelect,
} from '#components'

export type MembershipType = InstanceType<typeof MembershipTypeSelect>['$props']['modelValue']
export type OrganizationItem = InstanceType<typeof OrganizationItemSelect>['$props']['modelValue']
