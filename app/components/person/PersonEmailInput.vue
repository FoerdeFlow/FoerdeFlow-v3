<script setup lang="ts">
const id = useId()
const model = defineModel<string>()
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) E-Mail-Adresse
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		type="email"
		autocomplete="email"
	)
</template>
