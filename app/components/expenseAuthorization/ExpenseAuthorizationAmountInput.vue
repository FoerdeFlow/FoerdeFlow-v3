<script setup lang="ts">
const id = useId()

const props = defineProps<{
	readonly?: boolean
}>()

const model = defineModel<number | null>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Ausgaben
	div.kern-hint(
		:id="`${id}-hint`"
	) Falls die erwarteten Einnahmen die Ausgaben übersteigen, bitte den Betrag mit einem Minuszeichen angeben.
	KernCurrencyInput(
		v-if="props.readonly"
		:id="id"
		:model-value="formatCurrency(model) as unknown as number"
		:aria-describedby="`${id}-hint`"
		readonly
	)
	KernCurrencyInput(
		v-else
		:id="id"
		v-model="model"
		:aria-describedby="`${id}-hint`"
	)
</template>
