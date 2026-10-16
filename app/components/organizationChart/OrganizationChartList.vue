<script setup lang="ts">
import type { OrganizationChartNode } from '~/types'

const props = defineProps<{
	items: OrganizationChartNode[]
	highlight?: string
}>()
</script>

<template lang="pug">
ul.ff3-org-list
	li(
		v-for="item of props.items"
		:key="item.id"
	)
		span(
			v-if="item.id === props.highlight"
			aria-current="page"
		) {{ item.name }}
		NuxtLink.kern-link.kern-link--no-visited-state(
			v-else
			:to="{ name: 'organizationItems-organizationItem', params: { organizationItem: item.id } }"
		) {{ item.name }}
		span.ff3-org-list__inactive(v-if="item.inactive")  (inaktiv)
		OrganizationChartList(
			v-if="item.children.length > 0"
			:items="item.children"
			:highlight="props.highlight"
		)
</template>

<style scoped>
.ff3-org-list {
	margin: var(--kern-metric-space-x-small) 0 0;
	padding: var(--kern-metric-space-x-small) 0 0;
	border-top: var(--kern-metric-border-width-default) solid var(--kern-color-layout-border);
	font-size: var(--kern-typography-font-size-small-static);
	list-style: none;
}

.ff3-org-list__inactive {
	color: var(--kern-color-layout-text-muted);
}

.ff3-org-list .ff3-org-list {
	margin: 0;
	padding: 0 0 0 var(--kern-metric-space-default);
	border-top: none;
}
</style>
