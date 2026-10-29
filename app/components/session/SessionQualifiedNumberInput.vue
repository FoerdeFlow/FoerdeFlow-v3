<script setup lang="ts">
const id = useId()
const periodModel = defineModel<number | null>('period', { required: true })
const numberModel = defineModel<number | null>('number', { required: true })

const periodInput = ref<number | null>(null)
const numberInput = ref<number | null>(null)

const valid = computed(() =>
	periodInput.value !== null &&
	numberInput.value !== null &&
	!Number.isNaN(periodInput.value) &&
	!Number.isNaN(numberInput.value) &&
	periodInput.value > 1000 &&
	numberInput.value > 0,
)

watch([ periodModel, numberModel ], ([ newPeriod, newNumber ]) => {
	if(periodInput.value !== newPeriod && newPeriod !== null) {
		periodInput.value = newPeriod
	}
	if(numberInput.value !== newNumber && newNumber !== null) {
		numberInput.value = newNumber
	}
}, { immediate: true })

watchEffect(() => {
	periodModel.value = valid.value ? periodInput.value : null
	numberModel.value = valid.value ? numberInput.value : null
})
</script>

<template lang="pug">
.kern-fieldset__body.kern-fieldset__body--horizontal
	.flex-1.kern-form-input
		label.kern-label(:for="`${id}-period`") Periode (erstes Jahr)
		input.kern-form-input__input(
			:id="`${id}-period`"
			v-model.number="periodInput"
			type="text"
			inputmode="numeric"
		)
	.flex-1.kern-form-input
		label.kern-label(:for="`${id}-number`") Fortlaufende Nummer
		input.kern-form-input__input(
			:id="`${id}-number`"
			v-model.number="numberInput"
			type="text"
			inputmode="numeric"
		)
p.kern-body(v-if="valid && periodModel && numberModel")
	b Sitzungsnummer:
	|
	| {{ formatSessionNumber(periodModel, numberModel) }}
</template>
