<script setup lang="ts">
const id = useId()

const props = defineProps<{
	label: string
	hint?: string
	maxLength?: number
	multiline?: boolean
	readonly?: boolean
}>()

/** An empty field is kept as `null`, which is how the optional fields travel. */
const model = defineModel<string | null>({
	required: true,
})

const text = computed({
	get: () => model.value ?? '',
	set: (value: string) => {
		model.value = value === '' ? null : value
	},
})

const maxLength = computed(() => props.maxLength ?? 256)
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") {{ props.label }}
	.kern-hint(
		v-if="props.hint"
		:id="`${id}-hint`"
	) {{ props.hint }}
	textarea.kern-form-input__input(
		v-if="props.multiline"
		:id="id"
		v-model="text"
		:readonly="props.readonly"
		:maxlength="maxLength"
		:aria-describedby="props.hint ? `${id}-hint` : undefined"
		rows="4"
	)
	input.kern-form-input__input(
		v-else
		:id="id"
		v-model="text"
		:readonly="props.readonly"
		type="text"
		:maxlength="maxLength"
		:aria-describedby="props.hint ? `${id}-hint` : undefined"
	)
	KernCharacterCount(
		v-if="!props.readonly"
		:value="text"
		:max="maxLength"
	)
</template>
