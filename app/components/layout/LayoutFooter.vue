<script setup lang="ts">
const runtimeConfig = useRuntimeConfig()
const { settings } = useSettings()

const legalItems = [
	{ title: 'Impressum', link: '/impressum' },
	{ title: 'Datenschutzerklärung', link: '/datenschutz' },
	{ title: 'Barrierefreiheitserklärung', link: '/barrierefreiheit' },
]
</script>

<template lang="pug">
footer.ff3-footer.kern-layer.kern-level-1
	.kern-container
		.ff3-footer__bar
			div
				p.ff3-footer__name FördeFlow
				p.ff3-footer__claim
					| {{ settings?.providerName }}
					template(v-if="runtimeConfig.public.environment !== 'production'")
						|
						| · {{ $t(`environment.${runtimeConfig.public.environment}`) }}
			nav(aria-label="Rechtliche Hinweise")
				ul.ff3-footer__list
					li(
						v-for="item of legalItems"
						:key="item.link"
					)
						NuxtLink.ff3-footer__link(:to="item.link") {{ item.title }}
</template>

<style scoped>
.ff3-footer {
	margin-top: var(--kern-metric-space-2x-large);
	border-top: var(--kern-metric-border-width-light) solid var(--kern-color-layout-border-contextual);
}

.ff3-footer__bar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: var(--kern-metric-space-small) var(--kern-metric-space-large);
	padding: var(--kern-metric-space-large) var(--kern-metric-space-none);
}

.ff3-footer__name {
	margin: 0;
	color: var(--kern-color-layout-text-default-contextual);
	font-size: var(--kern-typography-font-size-small-static);
	font-weight: var(--kern-typography-font-weight-label-default);
	line-height: var(--kern-typography-line-height-medium-static);
}

.ff3-footer__claim {
	margin: 0;
	color: var(--kern-color-layout-text-muted-contextual);
	font-size: var(--kern-typography-font-size-small-static);
	line-height: var(--kern-typography-line-height-medium-static);
}

.ff3-footer__list {
	display: flex;
	flex-wrap: wrap;
	margin: 0;
	padding: 0;
	gap: var(--kern-metric-space-x-small) var(--kern-metric-space-default);
	list-style: none;
}

.ff3-footer__link {
	color: var(--kern-color-action-default-contextual);
	font-size: var(--kern-typography-font-size-small-static);
	line-height: var(--kern-typography-line-height-medium-static);
	text-decoration: underline;
	text-decoration-thickness: var(--kern-metric-border-width-light);
	text-underline-offset: var(--kern-metric-space-2x-small);
}

.ff3-footer__link:hover {
	text-decoration-thickness: var(--kern-metric-border-width-default);
}

/* KERN vergibt für `a[href]` keinen Fokusring, daher hier mit KERN-Token ergänzt. */
.ff3-footer__link:focus-visible {
	border-radius: var(--kern-metric-border-radius-default);
	outline: var(--kern-metric-border-width-bold) solid var(--kern-color-action-focus-default-contextual);
	outline-offset: var(--kern-metric-space-2x-small);
}
</style>
