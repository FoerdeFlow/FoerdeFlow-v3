<script setup lang="ts">
import type { OrganizationItem } from '~/types'

const id = useId()
const authStore = useAuthStore()

const typeModel = defineModel<'person' | 'organizationItem' | null>('type', {
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
			option(value="person") Ich ({{ authStore.userInfo.person ? formatPerson(authStore.userInfo.person) : 'Gast' }})
			option(value="organizationItem") Organisationseinheit
.kern-form-input(v-if="typeModel === 'organizationItem'")
	label.kern-label(:for="`${id}-organizationItem`") Organisationseinheit
	OrganizationItemSelect(
		:id="`${id}-organizationItem`"
		v-model="organizationItemModel"
	)
</template>
