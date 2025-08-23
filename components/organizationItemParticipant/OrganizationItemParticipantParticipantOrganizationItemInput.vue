<script setup lang="ts">
const id = useId()
const model = defineModel<string>()
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
