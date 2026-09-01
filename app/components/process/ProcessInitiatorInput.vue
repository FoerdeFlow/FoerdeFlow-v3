<script setup lang="ts">
import type { OrganizationItem } from '~/types'

const id = useId()
const authStore = useAuthStore()

const props = defineProps<{
	allowedInitiators?: ProcessAllowedInitiator[]
}>()

const typeModel = defineModel<ProcessInitiatorType | null>('type', {
	required: true,
})

const organizationItemModel = defineModel<OrganizationItem>('organizationItem', {
	required: true,
})

function onTypeChange() {
	organizationItemModel.value = null
}

const {
	personHasPermission,
	organizationItemHasPermission,
	filteredIds,
} = useProcessInitiatorTypes(() => props.allowedInitiators)
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
				v-if="organizationItemHasPermission"
				value="organizationItem"
			) Organisationseinheit
	div.kern-hint(
		v-if="!personHasPermission && !organizationItemHasPermission"
	) Sie sind nicht berechtigt, diesen Prozess zu starten.
.kern-form-input(v-if="typeModel === 'organizationItem'")
	label.kern-label(:for="`${id}-organizationItem`") Organisationseinheit
	OrganizationItemSelect(
		:id="`${id}-organizationItem`"
		v-model="organizationItemModel"
		:filtered-ids="filteredIds"
	)
</template>
