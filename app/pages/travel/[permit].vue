<script setup lang="ts">
import type { InternalApi } from 'nitropack'

import type { KernCardNavItems } from '~/types'

const route = useRoute('travel-permit')
const authStore = useAuthStore()
authStore.requireLogin()

// Typed by hand, the path would otherwise also match the static routes beside it.
const { data: permit } = useFetch<InternalApi['/api/travelPermits/:travelPermit']['get']>(
	`/api/travelPermits/${route.params.permit}`,
)
const { data: travelWorkflows } = useFetch('/api/travelPermits/workflows')
const { data: myWorkflows } = useFetch('/api/workflows', {
	query: {
		filter: 'mine',
	},
})

const startable = computed(() => new Set((myWorkflows.value ?? []).map((workflow) => workflow.id)))

const workflowItems = (workflows: { id: string, code: string, name: string }[]) => workflows
	.filter((workflow) => startable.value.has(workflow.id))
	.map((workflow) => ({
		preline: `Workflow-ID: ${workflow.code}`,
		title: workflow.name,
		link: {
			name: 'processes-create-workflow',
			params: { workflow: workflow.id },
			query: { travelPermit: route.params.permit },
		},
	})) satisfies KernCardNavItems

const advanceItems = computed(() => permit.value && !permit.value.advance && !permit.value.claim
	? workflowItems(travelWorkflows.value?.advances ?? [])
	: [])

const claimWindow = computed(() => permit.value ? travelClaimWindow(permit.value.endDate) : null)

const claimItems = computed(() => permit.value && !permit.value.claim && claimWindow.value === 'open'
	? workflowItems(travelWorkflows.value?.claims ?? [])
	: [])

const claim = computed(() => permit.value?.claim ?? null)

const budget = computed(() => permit.value?.budgetPlanItem?.plan.budget ?? permit.value?.budget ?? null)

const details = computed(() => permit.value
	? [
		{ key: 'Reisende*r', value: formatPerson(permit.value.traveler) },
		{ key: 'Rolle', value: formatTravelCoded(permit.value.role) },
		...permit.value.specialAllocation
			? [ {
				key: 'Haushaltssonderzuweisung',
				value: formatTravelCoded(permit.value.specialAllocation),
			} ]
			: [],
		{ key: 'Reise', value: `${permit.value.origin} – ${permit.value.destination}` },
		{
			key: 'Zeitraum',
			value: `${formatDate(permit.value.startDate)} bis ${formatDate(permit.value.endDate)}`,
		},
		{
			key: 'Verkehrsmittel',
			value: formatTravelCoded(permit.value.transportMode) +
				(permit.value.transportReason ? ` (${permit.value.transportReason.name})` : ''),
		},
		{ key: 'Haushalt', value: formatBudget(budget.value) || '–' },
		permit.value.budgetPlanItem
			? { key: 'Haushaltstitel', value: formatBudgetPlanItem(permit.value.budgetPlanItem) }
			: { key: 'Herkunft der Mittel', value: 'Rücklage' },
		...permit.value.advance
			? [ { key: 'Vorschuss', value: formatCurrency(permit.value.advance.amount, 'amount') } ]
			: [],
		...claim.value
			? [
				{
					key: 'Tatsächliche Kosten',
					value: formatCurrency(claim.value.requestedAmount, 'amount'),
				},
				{ key: 'Erstattet', value: formatCurrency(claim.value.amount, 'amount') },
				{
					key: claim.value.payoutAmount < 0 ? 'Zurückzuzahlen' : 'Auszuzahlen',
					value: formatCurrency(Math.abs(claim.value.payoutAmount), 'amount'),
				},
			]
			: [ { key: 'Erstattung zu beantragen bis', value: formatDate(permit.value.claimDeadline) } ],
	]
	: [])
</script>

<template lang="pug">
header(v-if="permit")
	p.kern-preline Dienstreisegenehmigung
	h1.kern-heading-large {{ permit.title }}
dl.kern-description-list(v-if="permit")
	.kern-description-list-item(
		v-for="detail of details"
		:key="detail.key"
	)
		dt.kern-description-list-item__key {{ detail.key }}
		dd.kern-description-list-item__value {{ detail.value }}
p.kern-body(v-if="permit?.description") {{ permit.description }}
KernTable.mt-8(
	v-if="permit"
	caption="Genehmigte Kosten"
	:columns="[ 'costType', { name: 'amount', width: '12em', class: 'numeric' } ]"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	:data="permit.items"
)
	template(#costType-header)
		| Kostenart
	template(#costType-body="{ item }")
		| {{ formatTravelCoded(item.costType) }}
		template(v-if="item.description")
			br
			span.kern-body--small {{ item.description }}
	template(#amount-header)
		| Höchstbetrag
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.amount, 'amount') }}
template(v-if="advanceItems.length > 0")
	h2.kern-heading-medium.mt-8 Vorschuss beantragen
	KernCardNav(:items="advanceItems")
template(v-if="claimItems.length > 0")
	h2.kern-heading-medium.mt-8 Erstattung beantragen
	KernCardNav(:items="claimItems")
p.kern-body.mt-8(v-else-if="permit && !permit.claim && claimWindow === 'early'")
	| Die Erstattung kann ab dem Ende der Reise beantragt werden.
</template>
