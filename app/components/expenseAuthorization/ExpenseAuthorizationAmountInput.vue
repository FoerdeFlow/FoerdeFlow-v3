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
	label="Ausgaben"
	hint="Falls die erwarteten Einnahmen die Ausgaben übersteigen, bitte den Betrag mit einem Minuszeichen angeben."
	:readonly="props.readonly"
)
</template>
