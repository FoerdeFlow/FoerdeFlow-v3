<script setup lang="ts">
const id = useId()

const props = defineProps<{
	/** The ordinals of the other titles of the plan, which may not be repeated. */
	usedOrds?: number[]
}>()

const model = defineModel<number | null>({
	required: true,
})

const error = computed(() => {
	if(typeof model.value !== 'number' || !Number.isInteger(model.value) || model.value < 1) {
		return 'Bitte geben Sie eine ganze Zahl größer als 0 ein.'
	}
	if(props.usedOrds?.includes(model.value)) {
		return 'Diese laufende Nummer ist bereits vergeben.'
	}
	return null
})

const describedBy = computed(() => [
	`${id}-hint`,
	error.value ? `${id}-error` : null,
].filter((value) => value !== null).join(' '))
</script>

<template lang="pug">
.kern-form-input(
	:class="{ 'kern-form-input--error': error }"
)
	label.kern-label(
		:for="id"
	) Laufende Nummer
	.kern-hint(
		:id="`${id}-hint`"
	)
		| Legt die Reihenfolge fest und darf je Haushaltsplan nur einmal vorkommen.
		| Vergeben wird in Zehnerschritten, damit später Titel dazwischen passen.
	input.kern-form-input__input.kern-form-input__input--width-4(
		:id="id"
		v-model.number="model"
		type="text"
		inputmode="numeric"
		:class="{ 'kern-form-input__input--error': error }"
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
