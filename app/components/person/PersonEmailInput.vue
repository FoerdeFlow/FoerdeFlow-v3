<script setup lang="ts">
const id = useId()
const maxLength = 256
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
		:maxlength="maxLength"
	)
	KernCharacterCount(
		:value="model"
		:max="maxLength"
	)
</template>
