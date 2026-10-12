<script setup lang="ts">
const id = useId()

const props = defineProps<{
	label: string
	readonly?: boolean
}>()

const model = defineModel<Date | null>({
	required: true,
})
</script>

<template lang="pug">
fieldset.kern-fieldset
	legend.kern-label {{ props.label }}
	KernDateInput(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
		:show-time="false"
	)
</template>
