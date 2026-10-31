<script setup lang="ts">
import type { KernCardNavItems, TravelPermitSummary } from '~/types'

const authStore = useAuthStore()
authStore.requireLogin()

const { data: permits } = useFetch('/api/travelPermits', { default: () => [] })
const { data: travelWorkflows } = useFetch('/api/travelPermits/workflows')
const { data: myWorkflows } = useFetch('/api/workflows', {
	query: {
		filter: 'mine',
	},
})

const permitItems = computed(() => {
	const startable = new Set((myWorkflows.value ?? []).map((workflow) => workflow.id))
	return (travelWorkflows.value?.permits ?? [])
		.filter((workflow) => startable.has(workflow.id))
		.map((workflow) => ({
			preline: `Workflow-ID: ${workflow.code}`,
			title: workflow.name,
			description: workflow.description ?? undefined,
			link: {
				name: 'processes-create-workflow',
				params: { workflow: workflow.id },
			},
		})) satisfies KernCardNavItems
})

function status(permit: TravelPermitSummary) {
	if(permit.claim) {
		return permit.claim.payoutAmount < 0
			? `Erstattung beantragt, ${formatCurrency(-permit.claim.payoutAmount, 'amount')} zurückzuzahlen`
			: `Erstattung beantragt, ${formatCurrency(permit.claim.payoutAmount, 'amount')} auszuzahlen`
	}
	const window = travelClaimWindow(permit.endDate)
	const advance = permit.advance ? `Vorschuss ${formatCurrency(permit.advance.amount, 'amount')}, ` : ''
	if(window === 'early') return `${advance}Reise steht bevor oder läuft`
	if(window === 'open') {
		return `${advance}Erstattung bis ${formatDate(travelClaimDeadline(permit.endDate))} beantragen`
	}
	return `${advance}Frist für die Erstattung abgelaufen`
}
</script>

<template lang="pug">
h1.kern-heading-large Meine Dienstreisen
KernTable(
	caption="Ihre Dienstreisegenehmigungen"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	:columns=`[
		'title',
		'period',
		{ name: 'amount', width: '10em', class: 'numeric' },
		'status',
	]`
	:data="permits"
)
	template(#title-header)
		| Dienstreise
	template(#title-body="{ item }")
		NuxtLink.kern-link(:to="{ name: 'travel-permit', params: { permit: item.id } }") {{ item.title }}
		br
		span.kern-body--small {{ item.origin }} – {{ item.destination }}
	template(#period-header)
		| Zeitraum
	template(#period-body="{ item }")
		| {{ formatDate(item.startDate, 'compact') }} – {{ formatDate(item.endDate, 'compact') }}
	template(#amount-header)
		| Genehmigt
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.amount, 'amount') }}
	template(#status-header)
		| Stand
	template(#status-body="{ item }")
		| {{ status(item) }}
p.kern-body.mt-4(v-if="permits.length === 0") Sie haben noch keine genehmigten Dienstreisen.
template(v-if="permitItems.length > 0")
	h2.kern-heading-medium.mt-8 Dienstreise beantragen
	KernCardNav(:items="permitItems")
</template>
