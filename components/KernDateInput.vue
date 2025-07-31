<script setup lang="ts">
const props = defineProps<{
	id: string
}>()

const day = ref('')
const month = ref('')
const year = ref('')

const model = defineModel<string>()

watch([ day, month, year ], ([ d, m, y ]) => {
	if(!d.match(/^\d{1,2}$/) || !m.match(/^\d{1,2}$/) || !y.match(/^\d{4}$/)) {
		model.value = ''
		return
	}
	model.value = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}, { immediate: true })

watch(model, (value) => {
	if(value && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
		const [ y, m, d ] = value.split('-') as [ string, string, string ]
		if(day.value.padStart(2, '0') === d && month.value.padStart(2, '0') === m && year.value === y) return
		day.value = d
		month.value = m
		year.value = y
	}
}, { immediate: true })

const dayInput = ref<HTMLInputElement | null>(null)
const monthInput = ref<HTMLInputElement | null>(null)
const yearInput = ref<HTMLInputElement | null>(null)

function onDayInput() {
	if(day.value.match(/^\d{2}|[4-9]$/)) {
		monthInput.value?.focus()
	}
}

function onMonthInput() {
	if(month.value.match(/^\d{2}|[2-9]$/)) {
		yearInput.value?.focus()
	}
}
</script>

<template lang="pug">
.kern-fieldset__body.kern-fieldset__body--horizontal
	.kern-form-input
		label.kern-label(:for="`${props.id}-day`") Tag
		input.kern-form-input__input.kern-form-input__input--width-2(
			:id="`${props.id}-day`"
			type="text"
			inputmode="numeric"
			ref="dayInput"
			v-model="day"
			@input="onDayInput()"
		)
	.kern-form-input
		label.kern-label(:for="`${props.id}-month`") Monat
		input.kern-form-input__input.kern-form-input__input--width-2(
			:id="`${props.id}-month`"
			type="text"
			inputmode="numeric"
			ref="monthInput"
			v-model="month"
			@input="onMonthInput()"
		)
	.kern-form-input
		label.kern-label(:for="`${props.id}-year`") Jahr
		input.kern-form-input__input.kern-form-input__input--width-4(
			:id="`${props.id}-year`"
			type="text"
			inputmode="numeric"
			ref="yearInput"
			v-model="year"
		)
	button.mt-8.kern-button.kern-button--secondary(
		type="button"
		@click="day = ''; month = ''; year = ''"
	)
		span.kern-icon.kern-icon--delete
		span.kern-label.kern-sr-only Leeren
p.kern-text(v-if="model") #[b Datum:] {{ formatDate(model) }}
</template>