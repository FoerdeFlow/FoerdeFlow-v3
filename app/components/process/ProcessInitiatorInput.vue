<script setup lang="ts">
import type { Person, Role, OrganizationType, OrganizationItem } from '~/types'

const id = useId()
const authStore = useAuthStore()

const props = defineProps<{
	allowedInitiators?: {
		person: Person
		role: Role
		organizationType: (NonNullable<OrganizationType> & { items: NonNullable<OrganizationItem>[] }) | null
		organizationItem: OrganizationItem
	}[]
}>()

const typeModel = defineModel<'person' | 'organizationItem' | null>('type', {
	required: true,
})

const organizationItemModel = defineModel<OrganizationItem>('organizationItem', {
	required: true,
})

function onTypeChange() {
	organizationItemModel.value = null
}

const personHasPermission = computed(() =>
	props.allowedInitiators?.some((initiator) =>
		initiator.person?.id === authStore.userInfo.person?.id ||
		authStore.userInfo.roles.some((role) => initiator.role?.id === role.id),
	) ?? true,
)

const idFilters = computed<(string[] | undefined)[]>(() => [
	props.allowedInitiators?.flatMap((initiator) => {
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
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="`${id}-type`") Anforderer*in
	div.kern-hint(
		:id="`${id}-type-hint`"
	) Bitte wählen Sie aus, ob Sie die Anforderung für sich selbst oder im Namen einer Organisationseinheit stellen.
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="`${id}-type`"
			v-model="typeModel"
			:aria-describedby="`${id}-type-hint`"
			@change="onTypeChange"
		)
			option(
				v-if="personHasPermission"
				value="person"
			) Ich ({{ authStore.userInfo.person ? formatPerson(authStore.userInfo.person) : 'Gast' }})
			option(
				v-if="!filteredIds || filteredIds.length > 0"
				value="organizationItem"
			) Organisationseinheit
.kern-form-input(v-if="typeModel === 'organizationItem'")
	label.kern-label(:for="`${id}-organizationItem`") Organisationseinheit
	OrganizationItemSelect(
		:id="`${id}-organizationItem`"
		v-model="organizationItemModel"
		:filtered-ids="filteredIds"
	)
</template>
