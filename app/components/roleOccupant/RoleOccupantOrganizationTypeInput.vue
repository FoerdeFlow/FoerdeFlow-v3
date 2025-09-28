<script setup lang="ts">
import type { OrganizationType } from '~/types'

const id = useId()
const model = defineModel<OrganizationType>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") OE-Kategorie
	OrganizationTypeSelect(
		:id="id"
		v-model="model"
	)
</template>
