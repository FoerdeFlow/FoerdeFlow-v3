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
	) {{ $t('expenseAuthorizationItem.input.amount.label') }}
	div.kern-hint(
		:id="`${id}-hint`"
	) {{ $t('expenseAuthorizationItem.input.amount.hint') }}
	KernCurrencyInput(
		:id="id"
		v-model="model"
		:aria-describedby="`${id}-hint`"
	)
</template>
