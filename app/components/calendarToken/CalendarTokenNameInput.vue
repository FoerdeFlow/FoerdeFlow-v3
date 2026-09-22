<script setup lang="ts">
const id = useId()
const maxLength = 256
const model = defineModel<string>()
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('calendarToken.input.name.label') }}
	div.kern-hint(
		:id="`${id}-hint`"
	) {{ $t('calendarToken.input.name.hint') }}
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		type="text"
		:maxlength="maxLength"
		:aria-describedby="`${id}-hint`"
	)
	KernCharacterCount(
		:value="model"
		:max="maxLength"
	)
</template>
