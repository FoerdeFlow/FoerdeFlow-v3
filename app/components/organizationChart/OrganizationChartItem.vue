<script setup lang="ts">
import type { OrganizationChartNode } from '~/types'

const props = defineProps<{
	item: OrganizationChartNode
	highlight?: string
	horizontal?: boolean
}>()

/*
 * Nebeneinander stehen Kinder nur, wenn mindestens eines selbst Kinder hat.
 * Reine Blätter werden gestapelt, damit viele Geschwister schmal bleiben. Liegt
 * das Organigramm quer, stehen Geschwister ohnehin untereinander.
 */
const row = computed(() => !props.horizontal &&
	props.item.children.some((child) => child.children.length > 0))
</script>

<template lang="pug">
li.ff3-org__item
	.ff3-org__node(
		:class="{ 'ff3-org__node--row': row }"
	)
		.ff3-org__card.ff3-org__card--current(
			v-if="props.item.id === props.highlight"
			aria-current="page"
		)
			span.ff3-org__type {{ props.item.organizationType.name }}
			span.ff3-org__name {{ props.item.name }}
			span.ff3-org__code {{ props.item.code }}
		NuxtLink.ff3-org__card(
			v-else
			:to="{ name: 'organizationItems-organizationItem', params: { organizationItem: props.item.id } }"
		)
			span.ff3-org__type {{ props.item.organizationType.name }}
			span.ff3-org__name {{ props.item.name }}
			span.ff3-org__code {{ props.item.code }}
		ul.ff3-org__children(
			v-if="props.item.children.length > 0"
			:class="row ? 'ff3-org__children--row' : 'ff3-org__children--stack'"
		)
			OrganizationChartItem(
				v-for="child of props.item.children"
				:key="child.id"
				:item="child"
				:highlight="props.highlight"
				:horizontal="props.horizontal"
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
	text-decoration: none;
}

a.ff3-org__card:hover {
	border-color: var(--kern-color-action-default);
}

a.ff3-org__card:focus-visible {
	outline: var(--kern-metric-border-width-bold) solid var(--kern-color-action-focus-default);
	outline-offset: 2px;
}

.ff3-org__card--current {
	border-color: var(--kern-color-action-default);
	background-color: var(--kern-color-layout-background-hued);
	box-shadow: inset 0 0 0 1px var(--kern-color-action-default);
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
}

a.ff3-org__card .ff3-org__name {
	color: var(--kern-color-action-default);
	text-decoration: underline;
}

/*
 * Grundform, auch für schmale Bildschirme: Kinder eingerückt untereinander,
 * mit einer senkrechten Linie vom Elternknoten und je einem Abzweig.
 */
.ff3-org__children {
	margin: 0 0 0 var(--ff3-org-indent);
	padding: 0 0 0 var(--ff3-org-indent);
	list-style: none;
}

.ff3-org__children > li {
	position: relative;
	padding-top: var(--ff3-org-gap);
}

.ff3-org__children > li::before,
.ff3-org__children > li::after {
	position: absolute;
	left: calc(-1 * var(--ff3-org-indent));
	content: '';
}

.ff3-org__children > li::before {
	top: 0;
	bottom: 0;
	border-left: var(--ff3-org-line);
}

.ff3-org__children > li:last-child::before {
	bottom: auto;
	height: calc(var(--ff3-org-gap) + var(--ff3-org-tick));
}

.ff3-org__children > li::after {
	top: calc(var(--ff3-org-gap) + var(--ff3-org-tick));
	width: var(--ff3-org-indent);
	border-top: var(--ff3-org-line);
}

.ff3-org__children .ff3-org__node {
	width: 100%;
}

/*
 * Ab Tablet-Breite stehen Kinder, die selbst Kinder haben, klassisch
 * nebeneinander: eine Linie vom Elternknoten herab, ein Querbalken, und von
 * dort je eine Linie zu jeder Karte.
 */
@media (min-width: 48rem) {
	.ff3-org__node--row {
		align-items: center;
		width: auto;
	}

	.ff3-org__node--row > .ff3-org__card {
		width: var(--ff3-org-card-width);
	}

	.ff3-org__children--row {
		position: relative;
		display: flex;
		margin-left: 0;
		padding: var(--ff3-org-indent) 0 0;
	}

	.ff3-org__children--row::before {
		position: absolute;
		top: 0;
		left: 50%;
		height: var(--ff3-org-indent);
		border-left: var(--ff3-org-line);
		content: '';
	}

	.ff3-org__children--row > li {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--ff3-org-indent) var(--ff3-org-gap) 0;
	}

	.ff3-org__children--row > li::before {
		right: 0;
		bottom: auto;
		left: 0;
		height: 0;
		border-top: var(--ff3-org-line);
		border-left: none;
	}

	.ff3-org__children--row > li:first-child::before {
		left: 50%;
	}

	.ff3-org__children--row > li:last-child::before {
		right: 50%;
		height: 0;
	}

	.ff3-org__children--row > li:only-child::before {
		display: none;
	}

	.ff3-org__children--row > li::after {
		top: 0;
		left: 50%;
		width: 0;
		height: var(--ff3-org-indent);
		border-top: none;
		border-left: var(--ff3-org-line);
	}

	.ff3-org__children--row > li > .ff3-org__node {
		width: var(--ff3-org-card-width);
	}
}

/*
 * Quer liegendes Organigramm: Kinder stehen rechts neben ihrem Elternknoten,
 * untereinander und mittig zu ihm, verbunden über einen senkrechten Balken.
 */
@media (min-width: 48rem) {
	.ff3-org--horizontal .ff3-org__node {
		flex-direction: row;
		align-items: center;
		width: auto;
	}

	.ff3-org--horizontal .ff3-org__card {
		flex-shrink: 0;
		width: var(--ff3-org-card-width);
	}

	.ff3-org--horizontal .ff3-org__children {
		position: relative;
		margin: 0;
		padding: 0 0 0 var(--ff3-org-indent);
	}

	.ff3-org--horizontal .ff3-org__children::before {
		position: absolute;
		top: 50%;
		left: 0;
		width: var(--ff3-org-indent);
		border-top: var(--ff3-org-line);
		content: '';
	}

	.ff3-org--horizontal .ff3-org__children > li {
		display: flex;
		align-items: center;
		padding: calc(var(--ff3-org-gap) / 2) 0 calc(var(--ff3-org-gap) / 2) var(--ff3-org-indent);
	}

	.ff3-org--horizontal .ff3-org__children > li::before {
		top: 0;
		bottom: 0;
		left: 0;
		height: auto;
	}

	.ff3-org--horizontal .ff3-org__children > li:first-child::before {
		top: 50%;
	}

	.ff3-org--horizontal .ff3-org__children > li:last-child::before {
		bottom: 50%;
		height: auto;
	}

	.ff3-org--horizontal .ff3-org__children > li:only-child::before {
		display: none;
	}

	.ff3-org--horizontal .ff3-org__children > li::after {
		top: 50%;
		left: 0;
	}
}
</style>
