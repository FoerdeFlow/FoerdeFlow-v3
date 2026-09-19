<script setup lang="ts">
const id = useId()
const maxLength = 2048

const model = defineModel<string | null>({
	required: true,
	set: (value) => {
		return value?.length === 0 ? null : value
	},
})

const props = defineProps<{
	readonly?: boolean
}>()
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Beschreibung (Bewerbungsschreiben)
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
