<script setup lang="ts">
const navigationItems = [
	{
		type: 'Organisation',
		label: 'Organisationseinheiten',
		link: '/organizationItem',
	},
	{
		type: 'Organisation',
		label: 'OE-Kategorien',
		link: '/organizationType',
	},
	{
		type: 'Organisation',
		label: 'Mitgliedschaftsarten',
		link: '/membershipType',
	},
	{
		type: 'Organisation',
		label: 'Gründe für das Ende der Mitgliedschaft',
		link: '/membershipEndReason',
	},
	{
		type: 'Organisation',
		label: 'Personen',
		link: '/person',
	},
	{
		type: 'Campus',
		label: 'Gebäude',
		link: '/building',
	},
]
</script>

<template lang="pug">
h1.kern-heading-large Studierendenparlament der HAW Kiel
h2.kern-heading-medium Sitzungsverwaltung und Antragsmanagement
.kern-container
	.kern-row
		.kern-col(v-for="item of navigationItems")
			article.kern-card
				.kern-card__container
					header.kern-card__header
						p.kern-preline {{ item.type }}
						h2.kern-title {{ item.label }}
						h3.kern-subline(v-if="item.sublabel") {{ item.sublabel }}
					section.kern-card__body(v-if="item.description")
						p.kern-body {{ item.description }}
					footer.kern-card__footer
						button.kern-btn.kern-btn--primary(@click="$router.push(item.link)")
							span.kern-label Liste anzeigen
</template>