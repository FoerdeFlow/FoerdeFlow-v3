<script setup lang="ts">
const props = defineProps<{
	id: string
	showTime: boolean
}>()

const day = ref('')
const month = ref('')
const year = ref('')
const hour = ref('')
const minute = ref('')

const model = defineModel<string>()

watch([ day, month, year, hour, minute ], ([ d, m, y, h, i ]) => {
	if(!d.match(/^\d{1,2}$/) || !m.match(/^\d{1,2}$/) || !y.match(/^\d{4}$/)) {
		model.value = ''
		return
	}
	if(props.showTime && (!h.match(/^\d{1,2}$/) || !i.match(/^\d{1,2}$/))) {
		model.value = ''
		return
	}
	model.value = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T${h.padStart(2, '0')}:${i.padStart(2, '0')}:00`
}, { immediate: true })

watch(model, (value) => {
	if(!value) return
	if(value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)) {
		const date = new Date(value)
		day.value = String(date.getDate())
		month.value = String(date.getMonth() + 1)
		year.value = String(date.getFullYear())
		hour.value = String(date.getHours())
		minute.value = String(date.getMinutes())
		return
	}
	if(value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/)) {
		const [ datePart, timePart ] = value.split('T')
		if(!datePart || !timePart) return
		const [ y, m, d ] = datePart.split('-') as [ string, string, string ]
		const [ h, i ] = timePart.split(':') as [ string, string ]
		if(day.value.padStart(2, '0') === d && month.value.padStart(2, '0') === m && year.value === y) return
		if(hour.value.padStart(2, '0') === h && minute.value.padStart(2, '0') === i) return
		day.value = d
		month.value = m
		year.value = y
		hour.value = h
		minute.value = i
		return
	}
	if(value.match(/^\d{4}-\d{2}-\d{2}$/)) {
		const [ y, m, d ] = value.split('-') as [ string, string, string ]
		if(day.value.padStart(2, '0') === d && month.value.padStart(2, '0') === m && year.value === y) return
		day.value = d
		month.value = m
		year.value = y
		return
	}
}, { immediate: true })

const dayInput = ref<HTMLInputElement | null>(null)
const monthInput = ref<HTMLInputElement | null>(null)
const yearInput = ref<HTMLInputElement | null>(null)
const hourInput = ref<HTMLInputElement | null>(null)
const minuteInput = ref<HTMLInputElement | null>(null)

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

function onYearInput() {
	if(year.value.match(/^\d{4}$/)) {
		if(props.showTime) {
			hourInput.value?.focus()
		}
	}
}

function onHourInput() {
	if(hour.value.match(/^\d{2}|[2-9]$/)) {
		minuteInput.value?.focus()
	}
}

function onMinuteInput() {
	if(minute.value.match(/^\d{2}|[6-9]$/)) {
		// Do nothing
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
			@input="onYearInput()"
		)
	template(v-if="props.showTime")
		.kern-form-input
			label.kern-label(:for="`${props.id}-hour`") Stunde
			input.kern-form-input__input.kern-form-input__input--width-2(
				:id="`${props.id}-hour`"
				type="text"
				inputmode="numeric"
				ref="hourInput"
				v-model="hour"
				@input="onHourInput()"
			)
		.kern-form-input
			label.kern-label(:for="`${props.id}-minute`") Minute
			input.kern-form-input__input.kern-form-input__input--width-2(
				:id="`${props.id}-minute`"
				type="text"
				inputmode="numeric"
				ref="minuteInput"
				v-model="minute"
				@input="onMinuteInput()"
			)
	button.mt-8.kern-button.kern-button--secondary(
		type="button"
		@click="day = ''; month = ''; year = ''; hour = ''; minute = ''"
	)
		span.kern-icon.kern-icon--delete
		span.kern-label.kern-sr-only Leeren
p.kern-text(v-if="model") #[b Datum:] {{ props.showTime ? formatDatetime(model) : formatDate(model) }}
</template>