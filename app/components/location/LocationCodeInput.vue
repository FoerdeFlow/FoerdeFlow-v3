<script setup lang="ts">
const id = useId()
const maxLength = 16
const model = defineModel<string>()
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('location.input.code.label') }}
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		type="text"
		:maxlength="maxLength"
	)
	p.kern-form-input__hint {{ $t('location.input.code.hint') }}
	KernCharacterCount(
		:value="model"
		:max="maxLength"
	)
</template>
