<script setup lang="ts" generic="T extends string">
const id = useId()

const props = defineProps<{
	label: string
	hint?: string
	options: { value: T, label: string }[]
	readonly?: boolean
}>()

const model = defineModel<T>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") {{ props.label }}
	.kern-hint(
		v-if="props.hint"
		:id="`${id}-hint`"
	) {{ props.hint }}
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="id"
			v-model="model"
			:disabled="props.readonly"
			:aria-describedby="props.hint ? `${id}-hint` : undefined"
		)
			option(
				v-for="option of props.options"
				:key="option.value"
				:value="option.value"
			) {{ option.label }}
</template>
