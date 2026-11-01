<script setup lang="ts">
import type { OrganizationItem } from '~/types'

const id = useId()
const maxLength = 256

const typeModel = defineModel<
	'initiator' | 'referencedPerson' | 'organizationItem' | 'referencedOrganizationItem' | null
>('type', {
	required: true,
})

const referencedPersonModel = defineModel<string | null>('referencedPerson', {
	required: true,
})

const organizationItemModel = defineModel<OrganizationItem>('organizationItem', {
	required: true,
})

const referencedOrganizationItemModel = defineModel<string | null>('referencedOrganizationItem', {
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
			option(value="referencedOrganizationItem") Organisationseinheit aus Referenzfeld
.kern-form-input(v-if="typeModel === 'referencedPerson'")
	label.kern-label(:for="`${id}-referencedPerson`") Referenzfeld
	input.kern-form-input__input(
		:id="`${id}-referencedPerson`"
		v-model="referencedPersonModel"
		:maxlength="maxLength"
	)
	KernCharacterCount(
		:value="referencedPersonModel"
		:max="maxLength"
	)
.kern-form-input(v-if="typeModel === 'organizationItem'")
	label.kern-label(:for="`${id}-organizationItem`") Organisationseinheit
	OrganizationItemSelect(
		:id="`${id}-organizationItem`"
		v-model="organizationItemModel"
	)
.kern-form-input(v-if="typeModel === 'referencedOrganizationItem'")
	label.kern-label(:for="`${id}-referencedOrganizationItem`") Referenzfeld
	.kern-hint(:id="`${id}-referencedOrganizationItem-hint`")
		| Tabelle und Feld der Mutation, das die Organisationseinheit enthält, z. B. travelPermits.organizationItem
	input.kern-form-input__input(
		:id="`${id}-referencedOrganizationItem`"
		v-model="referencedOrganizationItemModel"
		:maxlength="maxLength"
		:aria-describedby="`${id}-referencedOrganizationItem-hint`"
	)
	KernCharacterCount(
		:value="referencedOrganizationItemModel"
		:max="maxLength"
	)
</template>
