<script setup lang="ts">
const id = useId()
const maxLength = 16

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
	) {{ $t('inventoryItem.input.inventoryNumber.label') }} #[span.kern-label__optional - Optional]
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		type="text"
		:maxlength="maxLength"
	)
	p.kern-form-input__hint {{ $t('inventoryItem.input.inventoryNumber.hint') }}
	KernCharacterCount(
		:value="model"
		:max="maxLength"
	)
</template>
