<script setup lang="ts">
const id = useId()
const maxLength = 1024

const props = defineProps<{
	readonly?: boolean
}>()
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
	) {{ $t('representationAllowance.input.description.label') }} #[span.kern-label__optional - Optional]
	textarea.kern-form-input__input(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
		:maxlength="maxLength"
	)
	KernCharacterCount(
		v-if="!props.readonly"
		:value="model"
		:max="maxLength"
	)
</template>
