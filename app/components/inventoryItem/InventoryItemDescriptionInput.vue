<script setup lang="ts">
const id = useId()
const maxLength = 4096

const model = defineModel<string | null>({
	required: true,
	get: (v) => v ?? '',
	set: (v) => v === '' ? null : v,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('inventoryItem.input.description.label') }} #[span.kern-label__optional - Optional]
	textarea.kern-form-input__input(
		:id="id"
		v-model="model"
		:maxlength="maxLength"
	)
	p.kern-form-input__hint {{ $t('inventoryItem.input.description.hint') }}
	KernCharacterCount(
		:value="model"
		:max="maxLength"
	)
</template>
