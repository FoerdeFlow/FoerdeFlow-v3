<script setup lang="ts">
import type { OrganizationItem } from '~/types'

const id = useId()
const model = defineModel<OrganizationItem>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Organisationseinheit
	OrganizationItemSelect(
		:id="id"
		v-model="model"
	)
</template>
