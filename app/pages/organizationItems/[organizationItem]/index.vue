<script setup lang="ts">
import type { OrganizationItemLogoEditor } from '#components'
import type { KernCardNavItems, OrganizationChartNode } from '~/types'

const route = useRoute('organizationItems-organizationItem')
const authStore = useAuthStore()

const logoEditor = useTemplateRef<typeof OrganizationItemLogoEditor>('logo-editor')

const { data, refresh } = useFetch(() => `/api/organizationItems/${route.params.organizationItem}`, {
	default: () => ({
		code: '',
		name: '',
		description: '',
		organizationType: { name: '' },
		dissolvedAt: null,
		inactive: false,
		hasLogo: false,
		parent: null,
		children: [],
	}),
})

/* Hängt an der Adresse, damit der Browser nach einem Wechsel nicht das alte Bild zeigt. */
const logoVersion = ref(0)
const logoUrl = computed(() =>
	`/api/organizationItems/${route.params.organizationItem}/logo?v=${logoVersion.value}`)

async function refreshLogo() {
	logoVersion.value++
	await refresh()
}

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
		inactive: data.value.inactive,
		children: data.value.children.map(({ id, code, name, organizationType, inactive }) =>
			({ id, code, name, organizationType, inactive, children: [] })),
	}
	if(!data.value.parent) return [ current ]
	const { id, code, name, organizationType, inactive } = data.value.parent
	return [ { id, code, name, organizationType, inactive, children: [ current ] } ]
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
	{
		title: 'Bankkonten',
		description: 'Konten, Kontoauszüge und Zahlungen',
		link: {
			name: 'organizationItems-organizationItem-bankAccounts',
			params: { organizationItem: route.params.organizationItem },
		},
		permission: 'bankTransactions.read',
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
	p(v-if="data.inactive || data.dissolvedAt")
		OrganizationItemStatusBadge(
			:dissolved-at="data.dissolvedAt"
			:inactive="data.inactive"
		)
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
section.mb-8
	h2.kern-heading-medium Logo
	img.ff3-organization-item__logo(
		v-if="data.hasLogo"
		:src="logoUrl"
		:alt="`Logo von ${data.name}`"
	)
	p.kern-body(v-else) Kein eigenes Logo – auf PDF-Dokumenten erscheint das Logo der nächsten übergeordneten Einheit.
	button.kern-btn.kern-btn--secondary(
		v-if="authStore.hasPermission('organizationItems.update').value"
		@click="logoEditor?.edit(route.params.organizationItem, data.hasLogo)"
	)
		span.kern-icon.kern-icon--drive-folder-upload(aria-hidden="true")
		span.kern-label Logo ändern
	OrganizationItemLogoEditor(
		ref="logo-editor"
		@refresh="refreshLogo"
	)
KernCardNav(
	:items="subPages"
	:scope="{ organizationItem: route.params.organizationItem }"
)
</template>

<style scoped>
.ff3-organization-item__logo {
	display: block;
	max-height: 6rem;
	max-width: 100%;
	margin-bottom: 1rem;
	padding: 0.5rem;
	background: #fff;
}
</style>
