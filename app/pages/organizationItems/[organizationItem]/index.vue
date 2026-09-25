<script setup lang="ts">
import type { KernCardNavItems } from '~/types'

const route = useRoute('organizationItems-organizationItem')

const { data } = useFetch(() => `/api/organizationItems/${route.params.organizationItem}`, {
	default: () => ({
		code: '',
		name: '',
		description: '',
		parent: null,
		children: [],
	}),
})

const subPages: KernCardNavItems = [
	{
		title: 'Mitglieder',
		link: {
			name: 'organizationItems-organizationItem-members',
			params: { organizationItem: route.params.organizationItem },
		},
		permission: 'memberships.read',
	},
	{
		title: 'Gruppen',
		description: 'Übersicht über die Gruppen',
		link: {
			name: 'organizationItems-organizationItem-groups',
			params: { organizationItem: route.params.organizationItem },
		},
		permission: 'organizationItemGroups.read',
	},
	{
		title: 'Sitzungen',
		description: 'Übersicht über die Sitzungen',
		link: {
			name: 'organizationItems-organizationItem-sessions',
			params: { organizationItem: route.params.organizationItem },
		},
		permission: 'sessions.read',
	},
	{
		title: 'Veranstaltungen',
		description: 'Übersicht über die Veranstaltungen',
		link: {
			name: 'organizationItems-organizationItem-events',
			params: { organizationItem: route.params.organizationItem },
		},
		permission: 'events.read',
	},
	{
		title: 'Inventar',
		description: 'Übersicht über die Gegenstände',
		link: {
			name: 'organizationItems-organizationItem-inventoryItems',
			params: { organizationItem: route.params.organizationItem },
		},
		permission: 'inventoryItems.read',
	},
	{
		title: 'Ausleihen',
		description: 'Übersicht über die ausgeliehenen Gegenstände',
		link: {
			name: 'organizationItems-organizationItem-inventoryLoans',
			params: { organizationItem: route.params.organizationItem },
		},
		permission: 'inventoryLoans.read',
	},
	{
		title: 'Vorlagen',
		description: 'Übersicht über die Vorlagen',
		link: {
			name: 'organizationItems-organizationItem-documents',
			params: { organizationItem: route.params.organizationItem },
		},
		permission: 'documents.read',
	},
	{
		title: 'Texte',
		description: 'Übersicht über die Texte',
		link: {
			name: 'organizationItems-organizationItem-texts',
			params: { organizationItem: route.params.organizationItem },
		},
		permission: 'texts.read',
	},
	{
		title: 'Aufwandsentschädigungen',
		description: 'Übersicht über die Aufwandsentschädigungen',
		link: {
			name: 'organizationItems-organizationItem-representationAllowances',
			params: { organizationItem: route.params.organizationItem },
		},
		permission: 'representationAllowances.read',
	},
]
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'organizationItems' }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Übersicht
header
	p.kern-preline Organisationseinheit
	h1.kern-heading-large {{ data.name }} ({{ data.code }})
.mb-8
	KernText(:text="data.description")
.ff3-relations(v-if="data.parent || data.children.length > 0")
	article.kern-card(v-if="data.parent")
		.kern-card__container
			header.kern-card__header
				hgroup.kern-hgroup
					h2.kern-title {{ data.parent.name }} ({{ data.parent.code }})
					p.kern-preline Übergeordnete Organisationseinheit
	article.kern-card(v-if="data.children.length > 0")
		.kern-card__container
			header.kern-card__header
				h2.kern-title Untergeordnete Organisationseinheiten
			section.kern-card__body
				ul.kern-list.kern-list--bullet
					li(
						v-for="item of data.children"
						:key="item.id"
					)
						| {{ item.name }} ({{ item.code }})
KernCardNav(
	:items="subPages"
	:scope="{ organizationItem: route.params.organizationItem }"
)
</template>

<style scoped>
/* Gleiches Raster wie KernCardNav, damit beide Kartenblöcke fluchten. */
.ff3-relations {
	display: grid;
	gap: var(--kern-metric-space-default);
	margin-bottom: var(--kern-metric-space-default);
}

@media (min-width: 48rem) {
	.ff3-relations {
		grid-template-columns: 1fr 1fr;
	}
}
</style>
