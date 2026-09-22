<script setup lang="ts">
interface HomeNavigationEntry {
	title: string
	link: string
	permission?: string
	requiresLogin?: boolean
}

interface HomeNavigationArea {
	title: string
	description: string
	entries: HomeNavigationEntry[]
}

const authStore = useAuthStore()

const areas: HomeNavigationArea[] = [
	{
		title: 'Meine Arbeit',
		description: 'Eigene Vorgänge einsehen und neue Anträge einreichen.',
		entries: [
			// TODO: Sobald es die Berechtigung gibt: workflowProcesses.read
			{ title: 'Meine Prozesse', link: '/processes', requiresLogin: true },
			{ title: 'Prozess starten', link: '/processes/create', permission: 'workflowProcesses.create' },
		],
	},
	{
		title: 'Organisation',
		description: 'Gremien, Personen, Finanzen und Wahlen der Studierendenschaft.',
		entries: [
			{
				title: 'Organisationseinheiten',
				link: '/organizationItems',
				permission: 'organizationItems.read',
			},
			{ title: 'Personen', link: '/person', permission: 'persons.read' },
			{ title: 'Haushalte', link: '/budgets', permission: 'budgets.read' },
			{ title: 'Wahlen', link: '/elections', permission: 'elections.read' },
		],
	},
	{
		title: 'Hochschule und Campus',
		description: 'Struktur der HAW Kiel sowie die Orte ihrer Sitzungen und Veranstaltungen.',
		entries: [
			{ title: 'Fachbereiche', link: '/departments', permission: 'departments.read' },
			{ title: 'Fachschaften', link: '/councils', permission: 'councils.read' },
			{ title: 'Abschlüsse', link: '/courseTypes', permission: 'courseTypes.read' },
			{ title: 'Studiengänge', link: '/courses', permission: 'courses.read' },
			{ title: 'Orte', link: '/location', permission: 'locations.read' },
		],
	},
	{
		title: 'Stammdaten und Administration',
		description: 'Kategorien, Vorlagen und Konfiguration der Anwendung.',
		entries: [
			{ title: 'OE-Kategorien', link: '/organizationType', permission: 'organizationTypes.read' },
			{ title: 'Mitgliedschaftsarten', link: '/membershipType', permission: 'membershipTypes.read' },
			{
				title: 'Gründe für das Ende der Mitgliedschaft',
				link: '/membershipEndReason',
				permission: 'membershipEndReasons.read',
			},
			{ title: 'Vorlagenarten', link: '/documentTypes', permission: 'documentTypes.read' },
			{ title: 'Veranstaltungsarten', link: '/eventTypes', permission: 'eventTypes.read' },
			{ title: 'Workflows', link: '/workflows', permission: 'workflows.read' },
			{ title: 'Ankündigungen', link: '/announcements', permission: 'announcements.create' },
			{ title: 'Rollen', link: '/roles', permission: 'roles.read' },
			{ title: 'Einstellungen', link: '/settings', permission: 'settings.read' },
		],
	},
]

// Bereiche ohne erreichbare Einträge werden samt Überschrift ausgeblendet.
const visibleAreas = computed(() => areas
	.map((area) => ({
		...area,
		entries: area.entries.filter((entry) =>
			(!entry.requiresLogin || authStore.loggedIn) &&
			(!entry.permission || authStore.hasPermission(entry.permission).value),
		),
	}))
	.filter((area) => area.entries.length > 0))
</script>

<template lang="pug">
nav.ff3-areas(aria-label="Bereiche")
	section.ff3-areas__area(
		v-for="area of visibleAreas"
		:key="area.title"
	)
		.ff3-areas__header
			h2.kern-heading-medium {{ area.title }}
			p.kern-body.kern-body--small.kern-body--muted {{ area.description }}
		ul.ff3-areas__list
			li(
				v-for="entry of area.entries"
				:key="entry.link"
			)
				article.kern-card.kern-card--small.kern-card--interactive.kern-card--hug
					.kern-card__container
						header.kern-card__header
							h3.kern-title.kern-title--small
								NuxtLink.kern-link--stretched(:to="entry.link") {{ entry.title }}
</template>

<style scoped>
.ff3-areas {
	display: grid;
	gap: var(--kern-metric-space-x-large);
}

.ff3-areas__header {
	margin-bottom: var(--kern-metric-space-small);
}

.ff3-areas__list {
	display: grid;
	gap: var(--kern-metric-space-small);
	margin: 0;
	padding: 0;
	list-style: none;
}

/*
 * `1fr` statt `auto-fit`: die Karten einer Zeile sollen gleich breit bleiben,
 * auch wenn ein Titel wie „Gründe für das Ende der Mitgliedschaft“ umbricht.
 */
@media (min-width: 48rem) {
	.ff3-areas__list {
		grid-template-columns: 1fr 1fr;
	}
}

@media (min-width: 75rem) {
	.ff3-areas__list {
		grid-template-columns: 1fr 1fr 1fr;
	}
}
</style>
