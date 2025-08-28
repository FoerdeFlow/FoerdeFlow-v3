<script setup lang="ts">
const navigationItems: {
	preline: string
	title: string
	subline?: string
	description?: string
	link: string
	linkLabel: string
}[] = [
	{
		preline: 'Organisation',
		title: 'Organisationseinheiten',
		link: '/organizationItems',
		linkLabel: 'Liste anzeigen',
	},
	{
		preline: 'Organisation',
		title: 'OE-Kategorien',
		link: '/organizationType',
		linkLabel: 'Liste anzeigen',
	},
	{
		preline: 'Organisation',
		title: 'Mitgliedschaftsarten',
		link: '/membershipType',
		linkLabel: 'Liste anzeigen',
	},
	{
		preline: 'Organisation',
		title: 'Gründe für das Ende der Mitgliedschaft',
		link: '/membershipEndReason',
		linkLabel: 'Liste anzeigen',
	},
	{
		preline: 'Organisation',
		title: 'Personen',
		link: '/person',
		linkLabel: 'Liste anzeigen',
	},
	{
		preline: 'Campus',
		title: 'Gebäude',
		link: '/building',
		linkLabel: 'Liste anzeigen',
	},
	{
		preline: 'Campus',
		title: 'Räume',
		link: '/room',
		linkLabel: 'Liste anzeigen',
	},
	{
		preline: 'Sitzung',
		title: 'Sitzungen',
		link: '/session',
		linkLabel: 'Liste anzeigen',
	},
]
</script>

<template lang="pug">
h1.kern-heading-large Studierendenparlament der HAW Kiel
h2.kern-heading-medium Sitzungsverwaltung und Antragsmanagement
KernCardNav(:items="navigationItems")
</template>
