<script setup lang="ts">
const listLimit = 5

// Bewusst ohne `await`: die Komponente hängt an einem `v-if` und darf keine
// Async-Komponente sein, weil sie sonst erst nach dem Hydrieren aufgelöst wird.
const { data: waiting } = useFetch('/api/processes', {
	query: {
		filter: 'waiting',
		limit: listLimit,
	},
})
const { data: drafts } = useFetch('/api/processDrafts')

// Die Anzahl stammt aus dem Endpunkt und kann größer als die Liste sein.
const hiddenWaiting = computed(() =>
	Math.max((waiting.value?.count ?? 0) - (waiting.value?.items.length ?? 0), 0),
)

const visibleDrafts = computed(() => drafts.value?.slice(0, listLimit) ?? [])
const hiddenDrafts = computed(() =>
	Math.max((drafts.value?.length ?? 0) - visibleDrafts.value.length, 0),
)
</script>

<template lang="pug">
section.ff3-tasks
	.ff3-tasks__group
		h2.kern-heading-medium
			| Wartet auf mich
			template(v-if="waiting && waiting.count > 0")
				|
				span.kern-badge.kern-badge--info.kern-badge--small
					span.kern-label.kern-label--small {{ waiting.count }}
		template(v-if="waiting && waiting.items.length > 0")
			ul.ff3-tasks__list
				li(
					v-for="item of waiting.items"
					:key="item.id"
				)
					article.kern-card.kern-card--small.kern-card--interactive
						.kern-card__container
							header.kern-card__header
								hgroup.kern-hgroup
									h3.kern-title.kern-title--small
										NuxtLink.kern-link--stretched(
											:to="{ name: 'processes-view-process', params: { process: item.id } }"
										) {{ item.mutations[0]?.title ?? item.workflow.name }}
									p.kern-preline {{ item.workflow.code }}
							section.kern-card__body
								p.kern-body.kern-body--small
									template(v-if="item.currentStep")
										| {{ item.currentStep.step.name }}
									template(v-else)
										| Offener Schritt
									template(v-if="item.previousStep?.modifiedAt")
										|
										| · seit {{ formatDatetime(item.previousStep.modifiedAt, 'compact') }}
			p.kern-body.kern-body--small.kern-body--muted(v-if="hiddenWaiting > 0")
				| und {{ hiddenWaiting }} weitere
		p.kern-body.kern-body--muted(v-else)
			| Aktuell wartet kein Vorgang auf eine Aktion von Ihnen.
		NuxtLink.kern-btn.kern-btn--tertiary(:to="{ name: 'processes' }")
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label Alle meine Prozesse
	.ff3-tasks__group(v-if="visibleDrafts.length > 0")
		h2.kern-heading-medium Meine Entwürfe
		ul.ff3-tasks__list
			li(
				v-for="draft of visibleDrafts"
				:key="draft.id"
			)
				article.kern-card.kern-card--small.kern-card--interactive
					.kern-card__container
						header.kern-card__header
							hgroup.kern-hgroup
								h3.kern-title.kern-title--small
									NuxtLink.kern-link--stretched(
										:to=`{
											name: 'processes-create-workflow',
											params: { workflow: draft.workflow.id },
											query: { draft: draft.id },
										}`
									) {{ draft.title ?? draft.workflow.name }}
								p.kern-preline {{ draft.workflow.code }}
						section.kern-card__body
							p.kern-body.kern-body--small
								| Zuletzt bearbeitet {{ formatDatetime(draft.modifiedAt, 'compact') }}
		p.kern-body.kern-body--small.kern-body--muted(v-if="hiddenDrafts > 0")
			| und {{ hiddenDrafts }} weitere
</template>

<style scoped>
.ff3-tasks {
	display: grid;
	gap: var(--kern-metric-space-x-large);
	margin-bottom: var(--kern-metric-space-2x-large);
}

/*
 * Beide Blöcke laufen über die volle Breite und verteilen ihre Karten selbst
 * auf Spalten. Ein Zweispalter aus den Blöcken selbst wäre unausgewogen, weil
 * die Anzahl offener Vorgänge und Entwürfe stark auseinanderliegt.
 */
.ff3-tasks__list {
	display: grid;
	gap: var(--kern-metric-space-small);
	margin: 0 0 var(--kern-metric-space-small) 0;
	padding: 0;
	list-style: none;
}

@media (min-width: 48rem) {
	.ff3-tasks__list {
		grid-template-columns: 1fr 1fr;
	}
}

@media (min-width: 75rem) {
	.ff3-tasks__list {
		grid-template-columns: 1fr 1fr 1fr;
	}
}
</style>
