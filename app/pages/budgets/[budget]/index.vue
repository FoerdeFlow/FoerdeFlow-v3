<script setup lang="ts">
import type { KernCardNavItems } from '~/types'

const route = useRoute('budgets-budget')

const { data } = useFetch(() => `/api/budgets/${route.params.budget}`, {
	default: () => ({
		organizationItem: null,
		code: '',
		name: '',
	}),
})

const subPages: KernCardNavItems = [
	{
		title: 'Haushaltspläne',
		link: {
			name: 'budgets-budget-plans',
			params: { budget: route.params.budget },
		},
		linkLabel: 'Haushaltspläne anzeigen',
		permission: 'budgetPlans.read',
	},
	{
		title: 'Rücklagenausschüttungen',
		link: {
			name: 'budgets-budget-expenseAuthorizations',
			params: { budget: route.params.budget },
		},
		linkLabel: 'Rücklagenausschüttungen anzeigen',
		permission: 'expenseAuthorizations.read',
	},
]
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'budgets' }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Übersicht
header
	p.kern-preline Haushalt
	h1.kern-heading-large {{ data.name }} ({{ data.code }})
KernCardNav(
	:items="subPages"
	:scope="data.organizationItem ? { organizationItem: data.organizationItem?.id } : undefined"
)
</template>
