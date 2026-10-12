<script setup lang="ts">
const id = useId()

const props = defineProps<{
	label: string
	hint?: string
	readonly?: boolean
}>()

const model = defineModel<boolean>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-check
	input.kern-form-check__checkbox(
		:id="id"
		v-model="model"
		type="checkbox"
		:disabled="props.readonly"
		:aria-describedby="props.hint ? `${id}-hint` : undefined"
	)
	label.kern-label(:for="id") {{ props.label }}
.kern-hint.mb-4(
	v-if="props.hint"
	:id="`${id}-hint`"
) {{ props.hint }}
</template>
