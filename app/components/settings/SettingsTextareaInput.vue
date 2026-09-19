<script setup lang="ts">
// Mehrzeilige Variante von SettingsTextInput für Angaben wie die Anschrift
// oder längere Erläuterungen. Zeilenumbrüche bleiben in der Ausgabe erhalten.
const id = useId()

const props = defineProps<{
	label: string
	hint?: string
	rows?: number
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
	textarea.kern-form-input__input(
		:id="id"
		v-model="model"
		:rows="props.rows ?? 3"
		:maxlength="props.max"
		:aria-describedby="props.hint ? `${id}-hint` : undefined"
	)
	KernCharacterCount(
		:value="model"
		:max="props.max"
	)
</template>
