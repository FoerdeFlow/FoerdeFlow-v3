<script setup lang="ts">
const id = useId()

const model = defineModel<number>({
	required: true,
})

const error = computed(() => Number.isInteger(model.value)
	? null
	: 'Bitte geben Sie eine ganze Zahl ein.')

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
	) Sortierung
	.kern-hint(
		:id="`${id}-hint`"
	) Kleinere Werte stehen in Mitgliederlisten und Auswahllisten weiter vorn, bei Gleichstand wird alphabetisch sortiert.
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
