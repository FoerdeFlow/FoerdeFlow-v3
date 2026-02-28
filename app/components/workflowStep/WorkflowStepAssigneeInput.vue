<script setup lang="ts">
import type { OrganizationItem } from '~/types'

const id = useId()

const typeModel = defineModel<'initiator' | 'referencedPerson' | 'organizationItem' | null>('type', {
	required: true,
})

const referencedPersonModel = defineModel<string | null>('referencedPerson', {
	required: true,
})

const organizationItemModel = defineModel<OrganizationItem>('organizationItem', {
	required: true,
})

function onTypeChange() {
	organizationItemModel.value = null
}
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="`${id}-type`") Zuweisung an
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="`${id}-type`"
			v-model="typeModel"
			@change="onTypeChange"
		)
			option(value="initiator") Anforderer*in
			option(value="referencedPerson") Person aus Referenzfeld
			option(value="organizationItem") Organisationseinheit
.kern-form-input(v-if="typeModel === 'referencedPerson'")
	label.kern-label(:for="`${id}-referencedPerson`") Referenzfeld
	input.kern-form-input__input(
		:id="`${id}-referencedPerson`"
		v-model="referencedPersonModel"
	)
.kern-form-input(v-if="typeModel === 'organizationItem'")
	label.kern-label(:for="`${id}-organizationItem`") Organisationseinheit
	OrganizationItemSelect(
		:id="`${id}-organizationItem`"
		v-model="organizationItemModel"
	)
</template>
