<script setup lang="ts">
const id = useId()
const periodModel = defineModel<number | null>('period', { required: true })
const numberModel = defineModel<number | null>('number', { required: true })

const period = ref<number | null>(null)
const number = ref<number | null>(null)

const valid = computed(() =>
	period.value !== null &&
	!Number.isNaN(period.value) &&
	!Number.isNaN(number.value) &&
	period.value > 1000 &&
	(number.value === null || number.value > 0),
)

watch([ periodModel, numberModel ], ([ newPeriod, newNumber ]) => {
	if(period.value !== newPeriod && newPeriod !== null) {
		period.value = newPeriod
	}
	if(number.value !== newNumber && newNumber !== null) {
		number.value = newNumber
	}
}, { immediate: true })

watchEffect(() => {
	periodModel.value = valid.value ? period.value : null
	numberModel.value = valid.value ? number.value : null
})
</script>

<template lang="pug">
.kern-fieldset__body.kern-fieldset__body--horizontal
	.flex-1.kern-form-input
		label.kern-label(:for="`${id}-period`") Periode (erstes Jahr)
		input.kern-form-input__input(
			:id="`${id}-period`"
			v-model.number="period"
			type="text"
			inputmode="numeric"
		)
	.flex-1.kern-form-input
		label.kern-label(:for="`${id}-number`") Fortlaufende Nummer
		input.kern-form-input__input(
			:id="`${id}-number`"
			v-model.number="number"
			type="text"
			inputmode="numeric"
		)
p.kern-text(v-if="valid && periodModel")
	b Vorlagennummer:
	|
	| {{ formatDocumentNumber(periodModel, numberModel) }}
</template>
