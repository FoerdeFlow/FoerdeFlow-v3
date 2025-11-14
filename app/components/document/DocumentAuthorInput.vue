<script setup lang="ts">
import type { OrganizationItem, Person } from '~/types'

const id = useId()

const typeModel = defineModel<'person' | 'organizationItem' | null>('type', {
	required: true,
})

const personModel = defineModel<Person>('person', {
	required: true,
})

const organizationItemModel = defineModel<OrganizationItem>('organizationItem', {
	required: true,
})

function onTypeChange() {
	personModel.value = null
	organizationItemModel.value = null
}
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="`${id}-type`") Art des Autors
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="`${id}-type`"
			v-model="typeModel"
			@change="onTypeChange"
		)
			option(value="organizationItem") Organisationseinheit
			option(value="person") Person
.kern-form-input(v-if="typeModel === 'person'")
	label.kern-label(:for="`${id}-person`") Person
	PersonSelect(
		:id="`${id}-person`"
		v-model="personModel"
	)
.kern-form-input(v-if="typeModel === 'organizationItem'")
	label.kern-label(:for="`${id}-organizationItem`") Organisationseinheit
	OrganizationItemSelect(
		:id="`${id}-organizationItem`"
		v-model="organizationItemModel"
	)
</template>
