<script setup lang="ts">
const model = defineModel<unknown>({
	required: true,
})

const hint = [
	'Je Feld ein Wert (vorausgefüllt) oder ein Objekt mit "mode"',
	'(prefill, locked oder hidden) und "value".',
	'Für Datumsfelder sind zusätzlich die Platzhalter',
	Object.keys(presetDateTokens).join(', '),
	'möglich.',
].join(' ')
</script>

<template lang="pug">
KernJsonInput(
	v-model="model"
	label="Presets-JSON"
	:hint="hint"
)
</template>
