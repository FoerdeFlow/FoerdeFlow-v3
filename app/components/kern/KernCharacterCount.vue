<script setup lang="ts">
// Begleitet ein Textfeld mit einer Zeichenbegrenzung. Die Anzeige bleibt so
// lange aus, wie der Text noch weit unter der Grenze liegt, und erscheint erst,
// wenn der verbleibende Platz knapp wird.
const props = defineProps<{
	/** The current content of the field. */
	value?: string | null
	/** The number of characters the field accepts at most. */
	max: number
}>()

/** The share of the limit from which on the count is shown. */
const threshold = 0.7

const count = computed(() => props.value?.length ?? 0)

const text = computed(() => {
	if(count.value < props.max * threshold) return null
	if(count.value >= props.max) {
		return `Die maximale Länge von ${formatNumber(props.max)} Zeichen ist erreicht.`
	}
	return `Noch ${formatNumber(props.max - count.value)} von ${formatNumber(props.max)} Zeichen frei.`
})
</script>

<template lang="pug">
//- Der Bereich bleibt im Dokument, damit Screenreader das Erscheinen und jede
//- weitere Änderung des Hinweises ansagen.
div(role="status")
	p.kern-body.kern-body--small.kern-body--muted.mt-2(v-if="text") {{ text }}
</template>
