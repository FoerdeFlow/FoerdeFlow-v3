<script setup lang="ts">
const model = defineModel<number | null>({
	required: true,
})
</script>

<template lang="pug">
KernCurrencyInput(
	v-model="model"
	:label="$t('expenseAuthorizationItem.fillTotal.label')"
	:hint="$t('expenseAuthorizationItem.fillTotal.hint')"
)
</template>
