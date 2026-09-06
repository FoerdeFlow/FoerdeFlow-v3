<script setup lang="ts">
const model = defineModel<number | null>({
	required: true,
})
</script>

<template lang="pug">
KernCurrencyInput(
	v-model="model"
	:label="$t('expenseAuthorizationItem.input.amount.label')"
	:hint="$t('expenseAuthorizationItem.input.amount.hint')"
)
</template>
