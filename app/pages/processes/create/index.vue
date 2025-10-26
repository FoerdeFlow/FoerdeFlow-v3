<script setup lang="ts">
import type { KernCardNavItems } from '~/types'

const { data } = useFetch('/api/workflows')

const navigationItems = computed(() =>
	(data.value?.map((workflow) => ({
		preline: `Workflow-ID: ${workflow.code}`,
		title: workflow.name,
		...(workflow.description ? { description: workflow.description } : {}),
		link: {
			name: 'processes-create-workflow',
			params: { workflow: workflow.id },
		},
		linkLabel: 'Prozess starten',
	})) ?? []) satisfies KernCardNavItems,
)
</script>

<template lang="pug">
h1.kern-heading-large Neuen Prozess erstellen
KernCardNav(:items="navigationItems")
</template>
