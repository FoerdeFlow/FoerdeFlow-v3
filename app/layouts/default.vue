<script setup lang="ts">
const { settings } = useSettings()

// Ohne gepflegten Namen bliebe sonst ein Gedankenstrich ohne Bezug stehen.
const officialLabel = computed(() => settings.value?.providerName
	? `Offizielle Website – ${settings.value.providerName}`
	: 'Offizielle Website')
const alertStore = useAlertStore()

const { data: announcements } = await useFetch('/api/announcements', {
	query: {
		filter: 'active',
	},
})
</script>

<template lang="pug">
a.ff3-skip-link(href="#inhalt") Direkt zum Inhalt springen
.kern-kopfzeile
	.kern-container
		.kern-kopfzeile__content
			span.kern-kopfzeile__label {{ officialLabel }}
LayoutEnvironmentBanner
LayoutHeader
main#inhalt.ff3-main.kern-container
	div(
		v-if="announcements && announcements.length > 0"
		aria-live="polite"
	)
		KernAlert(
			v-for="(announcement, idx) of announcements"
			:key="idx"
			type="info"
			:title="announcement.title"
			:text="announcement.text"
			:dismissible="false"
		)
	KernAlert(
		v-for="(alert, idx) of alertStore.alerts"
		:key="idx"
		:type="alert.type"
		:title="alert.title"
		:text="alert.text"
		@close="alertStore.alerts.splice(idx, 1)"
	)
	slot
LayoutFooter
</template>

<style scoped>
.ff3-main {
	flex: 1;
	padding-top: var(--kern-metric-space-large);
}

/*
 * Sprunglink: außerhalb des Fokus visuell verborgen, bei Tastaturfokus sichtbar
 * über dem Inhalt. `kern-sr-only` ist hier nicht nutzbar, da die Klasse den
 * Inhalt per `!important` dauerhaft ausblendet.
 */
.ff3-skip-link {
	position: absolute;
	z-index: 100;
	top: var(--kern-metric-space-small);
	left: var(--kern-metric-space-small);
	padding: var(--kern-metric-space-small) var(--kern-metric-space-default);
	border-radius: var(--kern-metric-border-radius-default);
	background-color: var(--kern-color-action-default);
	color: var(--kern-color-action-on-default);
	font-size: var(--kern-typography-font-size-small-static);
	font-weight: var(--kern-typography-font-weight-label-default);
	line-height: var(--kern-typography-line-height-medium-static);
	text-decoration: none;
	transform: translateY(calc(-100% - var(--kern-metric-space-large)));
}

.ff3-skip-link:focus {
	outline: var(--kern-metric-border-width-bold) solid var(--kern-color-action-focus-default);
	outline-offset: var(--kern-metric-space-2x-small);
	transform: translateY(0);
}
</style>
