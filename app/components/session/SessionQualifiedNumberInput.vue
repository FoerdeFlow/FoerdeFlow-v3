<script setup lang="ts">
const id = useId()
const periodModel = defineModel<number | null>('period', { required: true })
const numberModel = defineModel<number | null>('number', { required: true })

const period = ref<string>('')
const number = ref<string>('')

const periodAsNumber = computed(() => Number(period.value))
const numberAsNumber = computed(() => Number(number.value))

const valid = computed(() =>
	!Number.isNaN(periodAsNumber.value) &&
	!Number.isNaN(numberAsNumber.value) &&
	periodAsNumber.value > 1000 &&
	numberAsNumber.value > 0,
)

watchEffect(() => {
	periodModel.value = valid.value ? periodAsNumber.value : null
	numberModel.value = valid.value ? numberAsNumber.value : null
})

watch([ periodModel.value, numberModel.value ], ([ newPeriod, newNumber ]) => {
	if(periodAsNumber.value !== newPeriod) {
		period.value = newPeriod?.toString() ?? ''
	}
	if(numberAsNumber.value !== newNumber) {
		number.value = newNumber?.toString() ?? ''
	}
})
</script>

<template lang="pug">
.kern-fieldset__body.kern-fieldset__body--horizontal
	.flex-1.kern-form-input
		label.kern-label(:for="`${id}-period`") Periode (erstes Jahr)
		input.kern-form-input__input(
			:id="`${id}-period`"
			v-model="period"
			type="text"
			inputmode="numeric"
		)
	.flex-1.kern-form-input
		label.kern-label(:for="`${id}-number`") Fortlaufende Nummer
		input.kern-form-input__input(
			:id="`${id}-number`"
			v-model="number"
			type="text"
			inputmode="numeric"
		)
p.kern-text(v-if="valid && periodModel && numberModel")
	b Sitzungsnummer:
	|
	| {{ formatSessionNumber(periodModel, numberModel) }}
</template>
