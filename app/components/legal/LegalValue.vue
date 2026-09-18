<script setup lang="ts">
const props = defineProps<{
	value?: string
}>()
</script>

<template lang="pug">
span.ff3-legal-value(v-if="props.value") {{ props.value }}
em(v-else) noch zu ergänzen
</template>

<style scoped>
/*
 * Zeilenumbrüche aus der Konfiguration bleiben erhalten, damit mehrzeilige
 * Angaben wie eine Anschrift nicht in einer Zeile zusammenlaufen.
 */
.ff3-legal-value {
	white-space: pre-line;
}
</style>
