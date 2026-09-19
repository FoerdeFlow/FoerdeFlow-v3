<script setup lang="ts">
const id = useId()
const maxLength = 512
const model = defineModel<string>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Betreff der Erinnerung
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		type="text"
		:maxlength="maxLength"
	)
	KernCharacterCount(
		:value="model"
		:max="maxLength"
	)
</template>
