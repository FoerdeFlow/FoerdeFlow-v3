<script setup lang="ts">
const id = useId()
const model = defineModel<number>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Stufe
	div.kern-hint(
		:id="`${id}-hint`"
	) Die Unterschrift wird fällig, sobald alle Schritte mit kleinerer Stufe abgeschlossen sind.
	input.kern-form-input__input(
		:id="id"
		v-model.number="model"
		type="text"
		inputmode="numeric"
		:aria-describedby="`${id}-hint`"
	)
</template>
