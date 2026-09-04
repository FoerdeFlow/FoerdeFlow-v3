<script setup lang="ts">
const id = useId()

const props = defineProps<{
	label: string
	hint?: string
}>()

const model = defineModel<unknown>({
	required: true,
})

const error = ref<string | null>(null)

const text = computed({
	get: () => model.value === null || model.value === undefined
		? ''
		: JSON.stringify(model.value, null, 2),
	set: (value) => {
		if(value.trim() === '') {
			error.value = null
			model.value = null
			return
		}
		try {
			model.value = JSON.parse(value)
			error.value = null
		} catch(e: unknown) {
			error.value = e instanceof Error ? e.message : 'Ungültiges JSON'
		}
	},
})

const describedBy = computed(() => {
	if(error.value) return `${id}-error`
	return props.hint ? `${id}-hint` : undefined
})
</script>

<template lang="pug">
.kern-form-input(
	:class="{ 'kern-form-input--error': error }"
)
	label.kern-label(
		:for="id"
	) {{ props.label }}
	.kern-hint(
		v-if="props.hint"
		:id="`${id}-hint`"
	) {{ props.hint }}
	textarea.kern-form-input__input(
		:id="id"
		v-model="text"
		:aria-describedby="describedBy"
	)
	p.kern-error(
		v-if="error"
		:id="`${id}-error`"
		role="alert"
	)
		span.kern-icon.kern-icon--danger(aria-hidden="true")
		span.kern-body {{ error }}
</template>
