<script setup lang="ts">
const props = defineProps<{
	readonly?: boolean
}>()

const model = defineModel<number | null>({
	required: true,
})
</script>

<template lang="pug">
KernCurrencyInput(
	v-model="model"
	label="Ausgaben laut Kostenaufstellung"
	hint="Summe der Posten aus der Kostenaufstellung. Einnahmen sind als negative Beträge gegengerechnet."
	:readonly="props.readonly"
)
</template>
