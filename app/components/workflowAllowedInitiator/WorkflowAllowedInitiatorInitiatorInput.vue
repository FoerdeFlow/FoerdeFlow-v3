<script setup lang="ts">
import type { Person, Role, OrganizationType, OrganizationItem } from '~/types'

const id = useId()

const type = ref<string | null>(null)

const personModel = defineModel<Person>('person', {
	required: true,
})

const roleModel = defineModel<Role>('role', {
	required: true,
})

const organizationTypeModel = defineModel<OrganizationType>('organizationType', {
	required: true,
})

const organizationItemModel = defineModel<OrganizationItem>('organizationItem', {
	required: true,
})

function onTypeChange() {
	personModel.value = null
	roleModel.value = null
	organizationTypeModel.value = null
	organizationItemModel.value = null
}
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="`${id}-type`") Berechtigungsart
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="`${id}-type`"
			v-model="type"
			@change="onTypeChange"
		)
			option(value="none") Jede*r
			option(value="person") Person
			option(value="role") Rolle
			option(value="organizationType") OE-Kategorie
			option(value="organizationItem") Organisationseinheit
.kern-form-input(v-if="type === 'person'")
	label.kern-label(:for="`${id}-person`") Person
	PersonSelect(
		:id="`${id}-person`"
		v-model="personModel"
	)
.kern-form-input(v-if="type === 'role'")
	label.kern-label(:for="`${id}-role`") Rolle
	RoleSelect(
		:id="`${id}-role`"
		v-model="roleModel"
	)
.kern-form-input(v-if="type === 'organizationType'")
	label.kern-label(:for="`${id}-organizationType`") OE-Kategorie
	OrganizationTypeSelect(
		:id="`${id}-organizationType`"
		v-model="organizationTypeModel"
	)
.kern-form-input(v-if="type === 'organizationItem'")
	label.kern-label(:for="`${id}-organizationItem`") Organisationseinheit
	OrganizationItemSelect(
		:id="`${id}-organizationItem`"
		v-model="organizationItemModel"
	)
</template>
