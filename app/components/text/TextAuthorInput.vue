<script setup lang="ts">
import type { OrganizationItem } from '~/types'

const id = useId()
const authStore = useAuthStore()

const props = defineProps<{
	readonly?: boolean
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

const filteredIds = computed(() =>
	authStore.userInfo.roles.some((role) => role.isAdmin)
		? undefined
		: authStore.userInfo.permissions
			.filter((permission) => permission.permission === 'texts.update' && typeof permission.organizationItem === 'string')
			.map((permission) => permission.organizationItem as string),
)
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="`${id}-type`") Art des Autors
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="`${id}-type`"
			v-model="typeModel"
			:disabled="props.readonly"
			@change="onTypeChange"
		)
			option(value="person") Ich ({{ authStore.userInfo.person ? formatPerson(authStore.userInfo.person) : 'Gast' }})
			option(value="organizationItem") Organisationseinheit
.kern-form-input(v-if="typeModel === 'organizationItem'")
	label.kern-label(:for="`${id}-organizationItem`") Organisationseinheit
	OrganizationItemSelect(
		:id="`${id}-organizationItem`"
		v-model="organizationItemModel"
		:filtered-ids="filteredIds"
		:readonly="props.readonly"
	)
</template>
