<script setup lang="ts">
import type { KernCardNavItems } from '~/types'

const navigationItems: KernCardNavItems = [
	{
		preline: 'Organisation',
		title: 'Organisationseinheiten',
		link: '/organizationItems',
		linkLabel: 'Liste anzeigen',
		permission: 'organizationItems.read',
	},
	{
		preline: 'Organisation',
		title: 'OE-Kategorien',
		link: '/organizationType',
		linkLabel: 'Liste anzeigen',
		permission: 'organizationTypes.read',
	},
	{
		preline: 'Organisation',
		title: 'Mitgliedschaftsarten',
		link: '/membershipType',
		linkLabel: 'Liste anzeigen',
		permission: 'membershipTypes.read',
	},
	{
		preline: 'Organisation',
		title: 'Gründe für das Ende der Mitgliedschaft',
		link: '/membershipEndReason',
		linkLabel: 'Liste anzeigen',
		permission: 'membershipEndReasons.read',
	},
	{
		preline: 'Organisation',
		title: 'Personen',
		link: '/person',
		linkLabel: 'Liste anzeigen',
		permission: 'persons.read',
	},
	{
		preline: 'Campus',
		title: 'Gebäude',
		link: '/building',
		linkLabel: 'Liste anzeigen',
		permission: 'buildings.read',
	},
	{
		preline: 'Campus',
		title: 'Räume',
		link: '/room',
		linkLabel: 'Liste anzeigen',
		permission: 'rooms.read',
	},
	{
		preline: 'Finanzen',
		title: 'Haushalte',
		link: '/budgets',
		linkLabel: 'Liste anzeigen',
		permission: 'budgets.read',
	},
	{
		preline: 'Prozesse',
		title: 'Workflows',
		link: '/workflows',
		linkLabel: 'Liste anzeigen',
		permission: 'workflows.read',
	},
	{
		preline: 'Prozesse',
		title: 'Meine Prozesse',
		link: '/processes',
		linkLabel: 'Liste anzeigen',
		// TODO
		// permission: 'workflowProcesses.read',
	},
	{
		preline: 'Konfiguration',
		title: 'Ankündigungen',
		link: '/announcements',
		linkLabel: 'Liste anzeigen',
		permission: 'announcements.create',
	},
	{
		preline: 'Berechtigungen',
		title: 'Rollen',
		link: '/roles',
		linkLabel: 'Liste anzeigen',
		permission: 'roles.read',
	},
]
</script>

<template lang="pug">
h1.kern-heading-large Studierendenparlament der HAW Kiel
h2.kern-heading-medium Sitzungsverwaltung und Antragsmanagement
KernCardNav(:items="navigationItems")
</template>
