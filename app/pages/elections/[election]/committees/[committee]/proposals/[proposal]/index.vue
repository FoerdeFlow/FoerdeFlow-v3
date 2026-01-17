<script setup lang="ts">
import type { KernCardNavItems } from '~/types'

const route = useRoute('elections-election-committees-committee-proposals-proposal')

const { data: electionCommittee } = useFetch(() => `/api/electionCommittees/${route.params.committee}`, {
	default: () => ({
		committee: null,
	}),
})

const { data } = useFetch(() => `/api/electionProposals/${route.params.proposal}`, {
	default: () => ({
		proposal: null,
	}),
})

const subPages: KernCardNavItems = [
	{
		title: 'Kandidaturen',
		description: 'Kandidaturen für diesen Wahlvorschlag verwalten',
		link: {
			name: 'elections-election-committees-committee-proposals-proposal-candidates',
			params: {
				election: route.params.election,
				committee: route.params.committee,
				proposal: route.params.proposal,
			},
		},
		linkLabel: 'Kandidaturen anzeigen',
		permission: 'candidates.read',
	},
]
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to=`{
			name: 'elections-election-committees-committee-proposals',
			params: { election: route.params.election, committee: route.params.committee }
		}`
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zu: Wahlvorschläge für {{ electionCommittee.committee?.name }}
header
	p.kern-preline Wahlvorschlag
	h1.kern-heading-large {{ electionCommittee.committee?.name }}, eingereicht von {{ formatPerson(data.submitter) }}
KernCardNav(
	:items="subPages"
)
</template>
