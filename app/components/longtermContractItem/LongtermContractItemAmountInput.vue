<script setup lang="ts">
const id = useId()
const model = defineModel<number | null>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('longtermContractItem.input.amount.label') }}
	KernCurrencyInput(
		:id="id"
		v-model="model"
	)
</template>
