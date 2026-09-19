<script setup lang="ts">
const id = useId()
const maxLength = 256

const props = defineProps<{
	readonly?: boolean
}>()
const model = defineModel<string>()
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Titel der Ausgabe
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
		type="text"
		:maxlength="maxLength"
	)
	KernCharacterCount(
		v-if="!props.readonly"
		:value="model"
		:max="maxLength"
	)
</template>
