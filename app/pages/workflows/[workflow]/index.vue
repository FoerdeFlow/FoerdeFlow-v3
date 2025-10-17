<script setup lang="ts">
import type { KernCardNavItems } from '~/types'

const route = useRoute('workflows-workflow')

const { data } = useFetch(() => `/api/workflows/${route.params.workflow}`)

const subPages: KernCardNavItems = [
	{
		title: 'Workflow-Schritte',
		link: {
			name: 'workflows-workflow-steps',
			params: { workflow: route.params.workflow },
		},
		linkLabel: 'Workflow-Schritte anzeigen',
		permission: 'workflowSteps.read',
	},
	{
		title: 'Workflow-Mutationen',
		link: {
			name: 'workflows-workflow-mutations',
			params: { workflow: route.params.workflow },
		},
		linkLabel: 'Workflow-Mutationen anzeigen',
		permission: 'workflowMutations.read',
	},
]
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'workflows' }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Übersicht
template(v-if="data")
	header
		p.kern-preline Workflow
		h1.kern-heading-large {{ data.name }} ({{ data.code }})
	KernCardNav(:items="subPages")
</template>
