<script setup lang="ts">
const id = useId()

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
	)
</template>
