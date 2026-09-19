<script setup lang="ts">
// Die Einstellungen bestehen aus zwei Dutzend gleichartigen Textfeldern.
// Statt für jedes Feld eine eigene Komponente anzulegen, werden Beschriftung
// und Zeichengrenze hier als Eigenschaften übergeben.
const id = useId()

const props = defineProps<{
	label: string
	hint?: string
	/** The number of characters the column accepts at most. */
	max: number
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
		:maxlength="props.max"
		:aria-describedby="props.hint ? `${id}-hint` : undefined"
	)
	KernCharacterCount(
		:value="model"
		:max="props.max"
	)
</template>
