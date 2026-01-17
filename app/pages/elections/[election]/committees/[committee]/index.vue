<script setup lang="ts">
import type { KernCardNavItems } from '~/types'

const route = useRoute('elections-election-committees-committee')

const { data: election } = useFetch(() => `/api/elections/${route.params.election}`, {
	default: () => ({
		title: '',
	}),
})

const { data } = useFetch(() => `/api/electionCommittees/${route.params.committee}`, {
	default: () => ({
		committee: null,
	}),
})

const subPages: KernCardNavItems = [
	{
		title: 'Wahlvorschläge',
		description: 'Übersicht über die eingereichten Wahlvorschläge',
		link: {
			name: 'elections-election-committees-committee-proposals',
			params: { election: route.params.election, committee: route.params.committee },
		},
		linkLabel: 'Wahlvorschläge anzeigen',
		permission: 'electionProposals.read',
	},
]
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'elections-election-committees', params: { election: route.params.election } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Übersicht
header
	p.kern-preline Wahlgremium
	h1.kern-heading-large {{ election.title }}, {{ data.committee?.name }}
KernCardNav(
	:items="subPages"
)
</template>
