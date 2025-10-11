<script setup lang="ts">
import type { KernCardNavItems } from '~/types'

const route = useRoute('budgets-budget-plans-plan')
const { t } = useI18n()

const { data } = await useFetch(`/api/budgetPlans/${route.params.plan}`)

function downloadAsPdf() {
	open(`/api/budgetPlans/${route.params.plan}/pdf`)
}

const subPages = computed<KernCardNavItems>(() => [
	{
		title: t('expenseAuthorization.menu.title'),
		description: t('expenseAuthorization.menu.description'),
		link: {
			name: 'budgets-budget-plans-plan-expenseAuthorizations',
			params: {
				budget: route.params.budget,
				plan: route.params.plan,
			},
		},
		linkLabel: t('expenseAuthorization.menu.linkLabel'),
		permission: 'attendances.read',
	},
])
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'budgets-budget-plans', params: { budget: route.params.budget } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Haushaltsplan-Übersicht für den Haushalt {{ data?.budget.name }} ({{ data?.budget.code }})
header
	h1.kern-heading-large
		| Haushaltsplan zum Haushalt {{ data?.budget.name }} ({{ data?.budget.code }})
	p.kern-body--large
		| Haushaltsperiode:
		| {{ formatDate(data?.startDate ?? null, 'compact') }} – {{ formatDate(data?.endDate ?? null, 'compact') }}
.mb-8
	button.kern-btn.kern-btn--secondary(
		@click="downloadAsPdf"
	)
		span.kern-icon.kern-icon--download(aria-hidden="true")
		span.kern-label Als PDF exportieren
KernCardNav(
	:items="subPages"
	:scope="{ organizationItem: data?.budget.organizationItem ?? '' }"
)
</template>
