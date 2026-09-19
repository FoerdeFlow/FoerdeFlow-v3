<script setup lang="ts">
const id = useId()
const maxLength = 2048
const model = defineModel<string>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Erinnerungsnachricht
	textarea.kern-form-input__input(
		:id="id"
		v-model="model"
		:maxlength="maxLength"
	)
	KernCharacterCount(
		:value="model"
		:max="maxLength"
	)
</template>
