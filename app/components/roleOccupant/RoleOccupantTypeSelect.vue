<script setup lang="ts">
const id = useId()

const model = defineModel<'person' | 'membership' | 'anonymous' | null>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Art des Inhabers
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="id"
			v-model="model"
		)
			option(value="anonymous") Gastzugriff
			option(value="person") Person
			option(value="membership") Mitgliedschaft
</template>
