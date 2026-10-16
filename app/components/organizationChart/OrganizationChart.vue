<script setup lang="ts">
import type { OrganizationChartNode } from '~/types'

const props = defineProps<{
	/** The accessible name of the chart. */
	label: string
	/** The topmost units, each drawn as a subtree of its own. */
	items: OrganizationChartNode[]
	/** A unit to mark as the current page instead of linking it. */
	highlight?: string
	/** Draws the levels from left to right instead of top to bottom, from tablet width on. */
	horizontal?: boolean
}>()
</script>

<template lang="pug">
.ff3-org__wrapper
	ul.ff3-org(
		:class="{ 'ff3-org--horizontal': props.horizontal }"
		:aria-label="props.label"
	)
		OrganizationChartItem(
			v-for="item of props.items"
			:key="item.id"
			:item="item"
			:highlight="props.highlight"
			:horizontal="props.horizontal"
		)
</template>

<style scoped>
/* Breite Zeilen scrollen für sich, statt die ganze Seite zu verbreitern. */
.ff3-org__wrapper {
	overflow-x: auto;
}

/*
 * Schmal stehen alle Teilbäume untereinander und nutzen die volle Breite; ab
 * Tablet-Breite umbrechen sie nebeneinander mit fester Kartenbreite.
 */
.ff3-org {
	--ff3-org-card-width: 100%;

	display: grid;
	gap: var(--kern-metric-space-large);
	margin: 0;
	padding: 0;
	list-style: none;
}

@media (min-width: 48rem) {
	.ff3-org {
		--ff3-org-card-width: 14rem;

		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
	}
}
</style>
