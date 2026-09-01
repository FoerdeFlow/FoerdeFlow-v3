import type { OrganizationItem, OrganizationType, Person, Role } from '~/types'

export interface ProcessAllowedInitiator {
	person: Person
	role: Role
	organizationType:
		// eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
		| (NonNullable<OrganizationType> & { items: NonNullable<OrganizationItem>[] })
		| null
	organizationItem: OrganizationItem
}

export type ProcessInitiatorType = 'person' | 'organizationItem'

export function useProcessInitiatorTypes(
	allowedInitiators: () => ProcessAllowedInitiator[] | undefined,
) {
	const authStore = useAuthStore()

	const personHasPermission = computed(() =>
		allowedInitiators()?.some((initiator) =>
			initiator.person?.id === authStore.userInfo.person?.id ||
			authStore.userInfo.roles.some((role) => initiator.role?.id === role.id) ||
			Object.entries(initiator).every(([ key, value ]) => key === 'id' || value === null),
		) ?? true,
	)

	const idFilters = computed<(string[] | undefined)[]>(() => [
		allowedInitiators()?.flatMap((initiator) => {
			if(initiator.organizationItem) {
				return [ initiator.organizationItem.id ]
			}
			if(initiator.organizationType) {
				return initiator.organizationType.items.map((item) => item.id)
			}
			return []
		}),
		authStore.userInfo.permissions
			.filter((permission) => permission.permission === 'workflowProcesses.create')
			.some((permission) => permission.organizationItem === false)
			? undefined
			: authStore.userInfo.permissions
				.filter((permission) => permission.permission === 'workflowProcesses.create')
				.map((permission) => permission.organizationItem)
				.filter((item) => typeof item === 'string'),
	].filter((arr) => arr))

	const filteredIds = computed<string[] | undefined>(() => {
		if(idFilters.value.length === 0) return undefined
		return idFilters.value[0]?.filter((id) =>
			idFilters.value.every((filter) => filter === undefined || filter.includes(id)),
		)
	})

	const organizationItemHasPermission = computed(() =>
		!filteredIds.value || filteredIds.value.length > 0,
	)

	const availableTypes = computed<ProcessInitiatorType[]>(() => [
		...personHasPermission.value ? [ 'person' as const ] : [],
		...organizationItemHasPermission.value ? [ 'organizationItem' as const ] : [],
	])

	return {
		personHasPermission,
		organizationItemHasPermission,
		filteredIds,
		availableTypes,
	}
}
