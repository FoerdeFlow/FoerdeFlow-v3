<script setup lang="ts">
const id = useId()

const props = defineProps<{
	readonly?: boolean
}>()
const model = defineModel<string | null>({
	required: true,
	get: (v) => v ?? '',
	set: (v) => v === '' ? null : v,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Verwendungszweck
	div.kern-hint(
		:id="`${id}-hint`"
	) Der Text, der bei der Überweisung angegeben wird, etwa die Rechnungsnummer.
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
		:aria-describedby="`${id}-hint`"
		type="text"
		maxlength="256"
	)
</template>
