<script setup lang="ts">
const id = useId()
const maxLength = 1024
const model = defineModel<string | null>({
	required: true,
	get: (v) => v ?? '',
	set: (v) => v === '' ? null : v,
})

const { label = null, required = false } = defineProps<{
	label?: string | null
	required?: boolean
}>()
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	)
		| {{ label ?? 'Kommentar' }}
		span.kern-label__optional(v-if="!required") - Optional
	textarea.kern-form-input__input(
		:id="id"
		v-model="model"
		:required="required"
		:maxlength="maxLength"
	)
	KernCharacterCount(
		:value="model"
		:max="maxLength"
	)
</template>
