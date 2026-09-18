<script setup lang="ts">
// Die Einstellungen bestehen aus zwei Dutzend gleichartigen Textfeldern.
// Statt für jedes Feld eine eigene Komponente anzulegen, wird die Beschriftung
// hier als Eigenschaft übergeben.
const id = useId()

const props = defineProps<{
	label: string
	hint?: string
}>()

const model = defineModel<string>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ props.label }}
	div.kern-hint(
		v-if="props.hint"
		:id="`${id}-hint`"
	) {{ props.hint }}
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		type="text"
		:aria-describedby="props.hint ? `${id}-hint` : undefined"
	)
</template>
