<script setup lang="ts">
import type { KernCardNavItems, OrganizationChartNode } from '~/types'

const route = useRoute('organizationItems-organizationItem')

const { data } = useFetch(() => `/api/organizationItems/${route.params.organizationItem}`, {
	default: () => ({
		code: '',
		name: '',
		description: '',
		organizationType: { name: '' },
		parent: null,
		children: [],
	}),
})

/*
 * Ausschnitt des Organigramms: die übergeordnete Einheit, darunter diese und
 * darunter ihre Kinder. Tiefere Ebenen liefert der Endpunkt nicht mit.
 */
const chart = computed((): OrganizationChartNode[] => {
	const current = {
		id: route.params.organizationItem,
		code: data.value.code,
		name: data.value.name,
		organizationType: data.value.organizationType,
		children: data.value.children.map(({ id, code, name, organizationType }) =>
			({ id, code, name, organizationType, children: [] })),
	}
	if(!data.value.parent) return [ current ]
	const { id, code, name, organizationType } = data.value.parent
	return [ { id, code, name, organizationType, children: [ current ] } ]
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
section.mb-8(v-if="data.parent || data.children.length > 0")
	h2.kern-heading-medium Einordnung
	OrganizationChart(
		:label="`Einordnung von ${data.name} im Organigramm`"
		:items="chart"
		:highlight="route.params.organizationItem"
		horizontal
	)
KernCardNav(
	:items="subPages"
	:scope="{ organizationItem: route.params.organizationItem }"
)
</template>
