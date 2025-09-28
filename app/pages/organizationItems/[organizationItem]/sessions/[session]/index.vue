<script setup lang="ts">
import type { KernCardNavItems } from '~/types'

const route = useRoute('organizationItems-organizationItem-sessions-session')

const { data } = useFetch(() => `/api/sessions/${route.params.session}`, {
	default: () => ({
		organizationItem: {
			code: '',
		},
		period: 0,
		number: 0,
	}),
})

const { status: minutesStatus } =
	useFetch(() => `/api/sessions/${route.params.session}/minutes`, { method: 'HEAD' })

const subPages = computed<KernCardNavItems>(() => [
	{
		title: 'Anwesenheitsliste',
		description: 'Die Anwesenheitsliste gibt an, welche Mitglieder anwesend waren und welche entschuldigt oder unentschuldigt gefehlt haben. Sie bietet außerdem eine Liste der anwesenden Gäste.',
		link: {
			name: 'organizationItems-organizationItem-sessions-session-attendances',
			params: { organizationItem: route.params.organizationItem, session: route.params.session },
		},
		linkLabel: 'Zur Anwesenheitsliste',
		permission: 'attendances.read',
	},
	...(minutesStatus.value === 'success'
		? [ {
			title: 'Protokoll',
			description: 'Das Protokoll bietet eine Zusammenfassung der Sitzung, einschließlich der besprochenen Themen und der getroffenen Entscheidungen.',
			link: `/api/sessions/${route.params.session}/minutes`,
			linkTarget: '_blank' as const,
			linkLabel: 'Protokoll herunterladen (PDF)',
			permission: 'sessions.read',
		} ]
		: []),
])
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'organizationItems-organizationItem-sessions', params: { organizationItem: route.params.organizationItem } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Sitzungsübersicht
header
	p.kern-preline Sitzung
	h1.kern-heading-large {{ data.organizationItem.code }}-Sitzung {{ formatSessionNumber(data.period, data.number) }}
KernCardNav(:items="subPages")
</template>
