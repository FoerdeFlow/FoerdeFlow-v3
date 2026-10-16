<script setup lang="ts">
import type { OrganizationChartNode } from '~/types'

const props = defineProps<{
	item: OrganizationChartNode
	highlight?: string
	horizontal?: boolean
	/** The level of the unit within the chart, 0 for the topmost one. */
	depth?: number
}>()

const depth = computed(() => props.depth ?? 0)
const current = computed(() => props.item.id === props.highlight)
const hasChildren = computed(() => props.item.children.length > 0)

/*
 * Wie die Kinder erscheinen:
 * - `grid`: als Karten in einem umbrechenden Raster, eingefasst von einer Klammer.
 * - `list`: als Linkliste in der eigenen Karte. Im Organigramm der Übersicht
 *   bekommen nur die Kinder einer Wurzel eigene Karten, damit viele Gremien mit
 *   Untereinheiten nicht in die Breite wachsen.
 * - `branch`: quer liegend, verbunden über einen senkrechten Balken. Das gilt
 *   für Kinder, die selbst Kinder haben; reine Blätter stehen im Raster.
 */
const layout = computed(() => {
	if(!props.horizontal) return depth.value > 0 ? 'list' : 'grid'
	return props.item.children.some((child) => child.children.length > 0) ? 'branch' : 'grid'
})
</script>

<template lang="pug">
li.ff3-org__item(
	:class="{ 'ff3-org__item--wide': !props.horizontal && depth === 0 && hasChildren }"
)
	.ff3-org__node(
		:class="hasChildren ? `ff3-org__node--${layout}` : ''"
	)
		.ff3-org__card(
			:class="{ 'ff3-org__card--current': current, 'ff3-org__card--inactive': props.item.inactive }"
		)
			span.ff3-org__type {{ props.item.organizationType.name }}
			span.ff3-org__name(
				v-if="current"
				aria-current="page"
			) {{ props.item.name }}
			NuxtLink.ff3-org__name.kern-link.kern-link--no-visited-state(
				v-else
				:to="{ name: 'organizationItems-organizationItem', params: { organizationItem: props.item.id } }"
			) {{ props.item.name }}
			span.ff3-org__code {{ props.item.code }}
			span.kern-badge.kern-badge--warning.ff3-org__badge(v-if="props.item.inactive")
				span.kern-label.kern-label--small Inaktiv
			OrganizationChartList(
				v-if="layout === 'list' && hasChildren"
				:items="props.item.children"
				:highlight="props.highlight"
			)
		ul.ff3-org__children(
			v-if="layout !== 'list' && hasChildren"
			:class=`[
				'ff3-org__children--' + layout,
				{ 'ff3-org__children--single': props.item.children.length === 1 },
			]`
			:style="{ '--ff3-org-count': props.item.children.length }"
		)
			OrganizationChartItem(
				v-for="child of props.item.children"
				:key="child.id"
				:item="child"
				:highlight="props.highlight"
				:horizontal="props.horizontal"
				:depth="depth + 1"
			)
</template>

<style scoped>
.ff3-org__item {
	/* Höhe, auf der die Verbindungslinie seitlich an eine gestapelte Karte stößt. */
	--ff3-org-tick: 1.5rem;
	--ff3-org-line: var(--kern-metric-border-width-default) solid var(--kern-color-layout-border);
	--ff3-org-gap: var(--kern-metric-space-small);
	--ff3-org-indent: 1rem;
}

/*
 * Eine Wurzel mit Kindern nimmt die ganze Zeile ein, damit ihr Raster Platz hat.
 * Ohne `min-width` wüchse sie auf die Breite, die das Raster mit allen Kindern in
 * einer Zeile bräuchte.
 */
.ff3-org__item--wide {
	flex: 1 1 100%;
	min-width: 0;
}

.ff3-org__node {
	display: flex;
	flex-direction: column;
	width: var(--ff3-org-card-width);
}

.ff3-org__card {
	display: block;
	padding: var(--kern-metric-space-small) var(--kern-metric-space-default);
	border: var(--kern-metric-border-width-default) solid var(--kern-color-layout-border);
	border-radius: var(--kern-metric-border-radius-default);
	background-color: var(--kern-color-layout-background-default);
	color: var(--kern-color-layout-text-default);
}

.ff3-org__card--current {
	border-color: var(--kern-color-action-default);
	background-color: var(--kern-color-layout-background-hued);
	box-shadow: inset 0 0 0 1px var(--kern-color-action-default);
}

/* Inaktive Einheiten treten zurück; die Plakette sagt, warum. */
.ff3-org__card--inactive {
	border-style: dashed;
	background-color: transparent;
}

.ff3-org__badge {
	margin-top: var(--kern-metric-space-x-small);
}

.ff3-org__type,
.ff3-org__code {
	display: block;
	color: var(--kern-color-layout-text-muted);
	font-size: var(--kern-typography-font-size-small-static);
}

.ff3-org__name {
	display: block;
	font-weight: var(--kern-typography-font-weight-label-default);
	overflow-wrap: break-word;
	hyphens: auto;
}

.ff3-org__children {
	margin: 0;
	padding: 0;
	list-style: none;
}

/*
 * Raster: die Elternkarte mittig darüber, eine Linie hinab zu einer Klammer,
 * darin so viele Spalten, wie Kinder da sind und die Breite hergibt.
 */
.ff3-org__node--grid {
	align-items: center;
	width: 100%;
}

.ff3-org__node--grid > .ff3-org__card {
	width: var(--ff3-org-card-width);
}

.ff3-org__children--grid {
	--ff3-org-cell: var(--ff3-org-card-width);

	position: relative;
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(var(--ff3-org-cell), 1fr));
	gap: var(--ff3-org-gap);
	width: 100%;
	/* Nicht breiter als nötig, damit wenige Kinder nicht über leere Spalten verteilt werden. */
	max-width: calc(
		var(--ff3-org-count) * (var(--ff3-org-cell) + var(--ff3-org-gap)) + var(--ff3-org-gap) +
		2 * var(--kern-metric-border-width-default)
	);
	margin-top: var(--ff3-org-indent);
	padding: var(--ff3-org-gap);
	border: var(--ff3-org-line);
	border-radius: var(--kern-metric-border-radius-default);
	box-sizing: border-box;
}

.ff3-org__children--grid::before {
	position: absolute;
	bottom: 100%;
	left: 50%;
	height: var(--ff3-org-indent);
	border-left: var(--ff3-org-line);
	content: '';
}

.ff3-org__children--grid > li > .ff3-org__node {
	width: 100%;
}

/*
 * Zweig, auf schmalen Bildschirmen: Kinder eingerückt untereinander, mit einer
 * senkrechten Linie vom Elternknoten und je einem Abzweig.
 */
.ff3-org__children--branch {
	margin-left: var(--ff3-org-indent);
	padding-left: var(--ff3-org-indent);
}

.ff3-org__children--branch > li {
	position: relative;
	padding-top: var(--ff3-org-gap);
}

.ff3-org__children--branch > li::before,
.ff3-org__children--branch > li::after {
	position: absolute;
	left: calc(-1 * var(--ff3-org-indent));
	content: '';
}

.ff3-org__children--branch > li::before {
	top: 0;
	bottom: 0;
	border-left: var(--ff3-org-line);
}

.ff3-org__children--branch > li:last-child::before {
	bottom: auto;
	height: calc(var(--ff3-org-gap) + var(--ff3-org-tick));
}

.ff3-org__children--branch > li::after {
	top: calc(var(--ff3-org-gap) + var(--ff3-org-tick));
	width: var(--ff3-org-indent);
	border-top: var(--ff3-org-line);
}

.ff3-org__children--branch > li > .ff3-org__node {
	width: 100%;
}

/*
 * Quer liegendes Organigramm: Kinder stehen rechts neben ihrem Elternknoten und
 * mittig zu ihm. Blätter stehen in einer Klammer mit zwei Spalten, Kinder mit
 * eigenen Kindern untereinander an einem senkrechten Balken.
 */
@media (min-width: 48rem) {
	.ff3-org--horizontal .ff3-org__node--grid,
	.ff3-org--horizontal .ff3-org__node--branch {
		flex-direction: row;
		align-items: center;
		width: auto;
	}

	.ff3-org--horizontal .ff3-org__card {
		flex-shrink: 0;
		width: var(--ff3-org-card-width);
	}

	.ff3-org--horizontal .ff3-org__children--grid {
		grid-template-columns: repeat(2, var(--ff3-org-cell));
		width: auto;
		max-width: none;
		margin: 0 0 0 var(--ff3-org-indent);
	}

	.ff3-org--horizontal .ff3-org__children--single {
		grid-template-columns: var(--ff3-org-cell);
	}

	.ff3-org--horizontal .ff3-org__children--grid::before {
		top: 50%;
		right: 100%;
		bottom: auto;
		left: auto;
		width: var(--ff3-org-indent);
		height: 0;
		border-top: var(--ff3-org-line);
		border-left: none;
	}

	.ff3-org--horizontal .ff3-org__children--branch {
		position: relative;
		margin: 0;
		padding: 0 0 0 var(--ff3-org-indent);
	}

	.ff3-org--horizontal .ff3-org__children--branch::before {
		position: absolute;
		top: 50%;
		left: 0;
		width: var(--ff3-org-indent);
		border-top: var(--ff3-org-line);
		content: '';
	}

	.ff3-org--horizontal .ff3-org__children--branch > li {
		display: flex;
		align-items: center;
		padding: calc(var(--ff3-org-gap) / 2) 0 calc(var(--ff3-org-gap) / 2) var(--ff3-org-indent);
	}

	.ff3-org--horizontal .ff3-org__children--branch > li::before {
		top: 0;
		bottom: 0;
		left: 0;
		height: auto;
	}

	.ff3-org--horizontal .ff3-org__children--branch > li:first-child::before {
		top: 50%;
	}

	.ff3-org--horizontal .ff3-org__children--branch > li:last-child::before {
		bottom: 50%;
		height: auto;
	}

	.ff3-org--horizontal .ff3-org__children--branch > li:only-child::before {
		display: none;
	}

	.ff3-org--horizontal .ff3-org__children--branch > li::after {
		top: 50%;
		left: 0;
	}

	.ff3-org--horizontal .ff3-org__children--branch > li > .ff3-org__node {
		width: auto;
	}
}
</style>
