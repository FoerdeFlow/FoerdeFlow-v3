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
	label="Anzuweisender Betrag"
	:readonly="props.readonly"
)
</template>
