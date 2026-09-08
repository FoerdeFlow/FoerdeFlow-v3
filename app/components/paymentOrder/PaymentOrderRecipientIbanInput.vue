<script setup lang="ts">
const props = defineProps<{
	readonly?: boolean
}>()

/** The IBAN without its spaces, which is how it is stored and checked. */
const model = defineModel<string | null>({
	required: true,
})
</script>

<template lang="pug">
KernIbanInput(
	v-model="model"
	label="IBAN der Empfänger*in"
	:readonly="props.readonly"
)
</template>
