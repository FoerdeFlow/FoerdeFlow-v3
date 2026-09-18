<script setup lang="ts">
import type { NuxtLinkProps } from '#app'
import type { Scope } from '~/types'

const props = defineProps<{
	items: {
		preline?: string
		title: string
		subline?: string
		description?: string
		link: NuxtLinkProps['to']
		linkTarget?: '_blank'
		permission?: string
	}[]
	scope?: Scope
}>()

const authStore = useAuthStore()

const visibleItems = computed(() => props.items.filter((item) =>
	!item.permission || authStore.hasPermission(item.permission, props.scope ?? {}).value,
))
</script>

<template lang="pug">
//- Interaktive Card nach KERN: die ganze Karte ist über den gestreckten Link
//- in der Überschrift klickbar, deshalb trägt sie keine eigene Schaltfläche
//- („Vermeide eine Überfrachtung mit Schaltflächen und Aktionen“).
ul.kern-card-nav(v-if="visibleItems.length > 0")
	li(
		v-for="(item, idx) of visibleItems"
		:key="idx"
	)
		article.kern-card.kern-card--interactive
			.kern-card__container
				header.kern-card__header
					//- `kern-hgroup` sortiert die Vorzeile per CSS über die
					//- Überschrift, sodass die Überschrift im DOM zuerst steht.
					hgroup.kern-hgroup
						h2.kern-title
							NuxtLink.kern-link--stretched(
								:to="item.link"
								:target="item.linkTarget"
							)
								| {{ item.title }}
								template(v-if="item.linkTarget === '_blank'")
									|
									span.kern-icon.kern-icon--small.kern-icon--open-in-new(aria-hidden="true")
									//- Das führende Leerzeichen steht in der Zeichenkette, weil das
									//- leere Icon-Element keines zum barrierefreien Namen beiträgt.
									span.kern-sr-only {{ ' (öffnet in neuem Tab)' }}
						p.kern-preline(v-if="item.preline") {{ item.preline }}
						p.kern-subline(v-if="item.subline") {{ item.subline }}
				section.kern-card__body(v-if="item.description")
					KernText(:text="item.description")
</template>

<style scoped>
.kern-card-nav {
	display: grid;
	gap: var(--kern-metric-space-default);
	margin: 0;
	padding: 0;
	list-style: none;
}

@media (min-width: 48rem) {
	.kern-card-nav {
		grid-template-columns: 1fr 1fr;
	}
}

/*
 * Das Icon für „öffnet in neuem Tab“ ist Teil des Links und übernimmt dessen
 * Farbe; ohne diese Regel bliebe es auf der Standard-Textfarbe.
 */
.kern-card--interactive .kern-link--stretched .kern-icon {
	background-color: var(--kern-color-action-default-contextual);
	vertical-align: text-bottom;
}
</style>
