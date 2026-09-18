<script setup lang="ts">
const authStore = useAuthStore()
const route = useRoute()

const menuOpen = ref(false)

const items: { title: string, link: string, permission?: string }[] = [
	{ title: 'Start', link: '/' },
	{ title: 'Meine Prozesse', link: '/processes' },
	{ title: 'Organisationseinheiten', link: '/organizationItems', permission: 'organizationItems.read' },
	{ title: 'Personen', link: '/person', permission: 'persons.read' },
	{ title: 'Haushalte', link: '/budgets', permission: 'budgets.read' },
	{ title: 'Wahlen', link: '/elections', permission: 'elections.read' },
]

// Für Gäste gibt es keine erreichbaren Inhalte, daher entfällt die Navigation.
const navigation = computed(() => authStore.loggedIn
	? items
		.filter((item) => !item.permission || authStore.hasPermission(item.permission).value)
		.map((item) => ({
			...item,
			active: item.link === '/'
				? route.path === '/'
				: route.path === item.link || route.path.startsWith(`${item.link}/`),
		}))
	: [])
</script>

<template lang="pug">
header.ff3-header.kern-layer.kern-level-1
	.kern-container
		.ff3-header__bar
			NuxtLink.ff3-header__brand(to="/")
				img.ff3-header__logo(
					src="/favicon.png"
					alt=""
					width="40"
					height="40"
				)
				span.ff3-header__brand-name FördeFlow
			.ff3-header__actions
				LayoutThemeSwitch
				template(v-if="authStore.loggedIn")
					span.ff3-header__user
						span.kern-icon.kern-icon--small.kern-icon--account-circle(aria-hidden="true")
						span.kern-sr-only-mobile {{ authStore.displayName }}
					button.kern-btn.kern-btn--x-small.kern-btn--secondary(
						type="button"
						@click="authStore.logout()"
					)
						span.kern-icon.kern-icon--logout(aria-hidden="true")
						span.kern-label.kern-sr-only-mobile Abmelden
				button.kern-btn.kern-btn--x-small.kern-btn--primary(
					v-else
					type="button"
					@click="authStore.login()"
				)
					span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
					span.kern-label Anmelden
				button.kern-btn.kern-btn--x-small.kern-btn--tertiary.ff3-header__menu-toggle(
					v-if="navigation.length > 0"
					type="button"
					aria-controls="ff3-hauptnavigation"
					:aria-expanded="menuOpen"
					@click="menuOpen = !menuOpen"
				)
					span.kern-icon(
						:class="menuOpen ? 'kern-icon--close' : 'kern-icon--dehaze'"
						aria-hidden="true"
					)
					span.kern-sr-only Hauptnavigation
	nav.ff3-nav(
		v-if="navigation.length > 0"
		id="ff3-hauptnavigation"
		:class="{ 'ff3-nav--open': menuOpen }"
		aria-label="Hauptnavigation"
	)
		.kern-container
			ul.ff3-nav__list
				li(
					v-for="item of navigation"
					:key="item.link"
				)
					NuxtLink.ff3-nav__link(
						:to="item.link"
						:aria-current="item.active ? 'page' : undefined"
						@click="menuOpen = false"
					) {{ item.title }}
</template>

<style scoped>
/*
 * Kopfzeile und Seitenkopf liegen auf derselben KERN-Ebene und hätten damit die
 * gleiche Hintergrundfarbe. Die obere Linie trennt beide sichtbar voneinander.
 */
.ff3-header {
	border-top: var(--kern-metric-border-width-light) solid var(--kern-color-decorative-border-contextual);
	border-bottom: var(--kern-metric-border-width-light) solid var(--kern-color-layout-border-contextual);
}

.ff3-header__bar {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	gap: var(--kern-metric-space-small) var(--kern-metric-space-default);
	padding: var(--kern-metric-space-small) var(--kern-metric-space-none);
}

.ff3-header__brand {
	display: flex;
	align-items: center;
	gap: var(--kern-metric-space-small);
	text-decoration: none;
}

/*
 * Die Wortmarke ist das Blau #0254BD und erreicht auf dunklem Grund nur 2,6:1.
 * Die feste weiße Fläche hält das Logo in beiden Farbschemata bei über 6:1,
 * ohne die Markenfarbe zu verändern.
 */
.ff3-header__logo {
	width: var(--kern-metric-dimension-x-large);
	height: var(--kern-metric-dimension-x-large);
	padding: var(--kern-metric-space-2x-small);
	border-radius: var(--kern-metric-border-radius-default);
	background-color: var(--kern-color-white);
}

.ff3-header__brand-name {
	color: var(--kern-color-layout-text-default-contextual);
	font-size: var(--kern-typography-font-size-large-static);
	font-weight: var(--kern-typography-font-weight-heading-default);
	line-height: var(--kern-typography-line-height-large-static);
}

.ff3-header__actions {
	display: flex;
	align-items: center;
	gap: var(--kern-metric-space-small);
}

.ff3-header__user {
	display: flex;
	align-items: center;
	gap: var(--kern-metric-space-x-small);
	color: var(--kern-color-layout-text-default-contextual);
	font-size: var(--kern-typography-font-size-small-static);
	line-height: var(--kern-typography-line-height-medium-static);
}

.ff3-nav {
	border-top: var(--kern-metric-border-width-light) solid var(--kern-color-decorative-border-contextual);
}

.ff3-nav__list {
	display: flex;
	flex-direction: column;
	margin: 0;
	padding: 0;
	list-style: none;
}

.ff3-nav__link {
	display: block;
	padding: var(--kern-metric-space-small);
	border-left: var(--kern-metric-border-width-bold) solid transparent;
	color: var(--kern-color-action-default-contextual);
	font-size: var(--kern-typography-font-size-small-static);
	font-weight: var(--kern-typography-font-weight-label-default);
	line-height: var(--kern-typography-line-height-medium-static);
	text-decoration: none;
}

.ff3-nav__link:hover {
	text-decoration: underline;
	text-decoration-thickness: var(--kern-metric-border-width-default);
	text-underline-offset: var(--kern-metric-space-x-small);
}

.ff3-nav__link[aria-current='page'] {
	border-left-color: var(--kern-color-action-default-contextual);
	color: var(--kern-color-layout-text-default-contextual);
}

/* KERN vergibt für `a[href]` keinen Fokusring, daher hier mit KERN-Token ergänzt. */
.ff3-header__brand:focus-visible,
.ff3-nav__link:focus-visible {
	border-radius: var(--kern-metric-border-radius-default);
	outline: var(--kern-metric-border-width-bold) solid var(--kern-color-action-focus-default-contextual);
	outline-offset: var(--kern-metric-space-2x-small);
}

@media (max-width: 61.9375rem) {
	.ff3-nav:not(.ff3-nav--open) {
		display: none;
	}
}

@media (min-width: 62rem) {
	.ff3-header__menu-toggle {
		display: none;
	}

	.ff3-nav__list {
		flex-direction: row;
		gap: var(--kern-metric-space-large);
	}

	/* Auf breiten Viewports markiert eine Unterstreichung den aktiven Eintrag. */
	.ff3-nav__link {
		padding: var(--kern-metric-space-small) var(--kern-metric-space-none);
		border-bottom: var(--kern-metric-border-width-bold) solid transparent;
		border-left: none;
	}

	.ff3-nav__link[aria-current='page'] {
		border-bottom-color: var(--kern-color-action-default-contextual);
	}
}
</style>
