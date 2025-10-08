<script setup lang="ts">
const props = defineProps<{
	id: string
	showTime: boolean
	readonly?: boolean
}>()

const day = ref('')
const month = ref('')
const year = ref('')
const hour = ref('')
const minute = ref('')

const model = defineModel<Date | null>()

watch([ day, month, year, hour, minute ], ([ d, m, y, h, i ]) => {
	if(!(/^\d{1,2}$/.exec(d)) || !(/^\d{1,2}$/.exec(m)) || !(/^\d{4}$/.exec(y))) {
		model.value = null
		return
	}
	if(props.showTime && (!(/^\d{1,2}$/.exec(h)) || !(/^\d{1,2}$/.exec(i)))) {
		model.value = null
		return
	}
	const date = new Date()
	date.setFullYear(Number(y), Number(m) - 1, Number(d))
	date.setHours(props.showTime ? Number(h) : 0, props.showTime ? Number(i) : 0, 0, 0)
	model.value = date
}, { immediate: true })

watch(model, (value) => {
	if(!value) return
	day.value = String(value.getDate())
	month.value = String(value.getMonth() + 1)
	year.value = String(value.getFullYear())
	hour.value = String(value.getHours())
	minute.value = String(value.getMinutes())
}, { immediate: true })

const dayInput = ref<HTMLInputElement | null>(null)
const monthInput = ref<HTMLInputElement | null>(null)
const yearInput = ref<HTMLInputElement | null>(null)
const hourInput = ref<HTMLInputElement | null>(null)
const minuteInput = ref<HTMLInputElement | null>(null)

function onDayInput() {
	if(/^\d{2}|[4-9]$/.exec(day.value)) {
		monthInput.value?.focus()
	}
}

function onMonthInput() {
	if(/^\d{2}|[2-9]$/.exec(month.value)) {
		yearInput.value?.focus()
	}
}

function onYearInput() {
	if(/^\d{4}$/.exec(year.value)) {
		if(props.showTime) {
			hourInput.value?.focus()
		}
	}
}

function onHourInput() {
	if(/^\d{2}|[3-9]$/.exec(hour.value)) {
		minuteInput.value?.focus()
	}
}

function onMinuteInput() {
	if(/^\d{2}|[6-9]$/.exec(minute.value)) {
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
			ref="dayInput"
			v-model="day"
			type="text"
			inputmode="numeric"
			:readonly="props.readonly"
			@input="onDayInput()"
		)
	.kern-form-input
		label.kern-label(:for="`${props.id}-month`") Monat
		input.kern-form-input__input.kern-form-input__input--width-2(
			:id="`${props.id}-month`"
			ref="monthInput"
			v-model="month"
			type="text"
			inputmode="numeric"
			:readonly="props.readonly"
			@input="onMonthInput()"
		)
	.kern-form-input
		label.kern-label(:for="`${props.id}-year`") Jahr
		input.kern-form-input__input.kern-form-input__input--width-4(
			:id="`${props.id}-year`"
			ref="yearInput"
			v-model="year"
			type="text"
			inputmode="numeric"
			:readonly="props.readonly"
			@input="onYearInput()"
		)
	template(v-if="props.showTime")
		.kern-form-input
			label.kern-label(:for="`${props.id}-hour`") Stunde
			input.kern-form-input__input.kern-form-input__input--width-2(
				:id="`${props.id}-hour`"
				ref="hourInput"
				v-model="hour"
				type="text"
				inputmode="numeric"
				:readonly="props.readonly"
				@input="onHourInput()"
			)
		.kern-form-input
			label.kern-label(:for="`${props.id}-minute`") Minute
			input.kern-form-input__input.kern-form-input__input--width-2(
				:id="`${props.id}-minute`"
				ref="minuteInput"
				v-model="minute"
				type="text"
				inputmode="numeric"
				:readonly="props.readonly"
				@input="onMinuteInput()"
			)
	button.mt-8.kern-button.kern-button--secondary(
		v-if="!props.readonly"
		type="button"
		@click="day = ''; month = ''; year = ''; hour = ''; minute = ''"
	)
		span.kern-icon.kern-icon--delete
		span.kern-label.kern-sr-only Leeren
p.kern-text(v-if="model") #[b Datum:] {{ props.showTime ? formatDatetime(model) : formatDate(model) }}
</template>
