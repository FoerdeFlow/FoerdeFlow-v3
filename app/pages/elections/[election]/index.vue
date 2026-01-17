<script setup lang="ts">
import type { KernCardNavItems } from '~/types'

const route = useRoute('elections-election')

const { data } = useFetch(() => `/api/elections/${route.params.election}`, {
	default: () => ({
		title: '',
		date: null,
	}),
})

const subPages: KernCardNavItems = [
	{
		title: 'Gremien',
		description: 'Übersicht über die zur Wahl stehenden Gremien',
		link: {
			name: 'elections-election-committees',
			params: { election: route.params.election },
		},
		linkLabel: 'Wahlgremien anzeigen',
		permission: 'electionCommittees.read',
	},
]
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'elections' }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Übersicht
header
	p.kern-preline Wahl
	h1.kern-heading-large {{ data.title }}
KernCardNav(
	:items="subPages"
)
</template>
