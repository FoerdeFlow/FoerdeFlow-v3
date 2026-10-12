<script setup lang="ts">
import type { InternalApi } from 'nitropack'

import type { KernCardNavItems } from '~/types'

const route = useRoute('travel-permit')
const authStore = useAuthStore()
authStore.requireLogin()

const { data: permit } = useFetch<InternalApi['/api/travelPermits/:travelPermit']['get']>(
	`/api/travelPermits/${route.params.permit}`,
)
const { data: claimWorkflows } = useFetch('/api/travelPermits/claimWorkflows')
const { data: myWorkflows } = useFetch('/api/workflows', {
	query: {
		filter: 'mine',
	},
})

const budget = computed(() => permit.value?.budgetPlanItem?.plan.budget ?? permit.value?.budget ?? null)

const claimable = computed(() => !!permit.value &&
	(permit.value.kind === 'general' || permit.value.claims.length === 0))

const claimItems = computed(() => {
	const startable = new Set((myWorkflows.value ?? []).map((workflow) => workflow.id))
	return (claimWorkflows.value ?? [])
		.filter((workflow) => startable.has(workflow.id))
		.map((workflow) => ({
			preline: `Workflow-ID: ${workflow.code}`,
			title: workflow.name,
			link: {
				name: 'processes-create-workflow',
				params: { workflow: workflow.id },
			},
		})) satisfies KernCardNavItems
})

const deadline = computed(() => permit.value?.kind === 'single'
	? travelClaimDeadline(permit.value.endDate, travelMeta(null).claimDeadlineDays)
	: null)

const details = computed(() => permit.value
	? [
		{ key: 'Art der Genehmigung', value: formatTravelPermitKind(permit.value.kind) },
		{ key: 'Reiseziel', value: permit.value.destination + (permit.value.domestic ? '' : ' (Ausland)') },
		{
			key: permit.value.kind === 'general' ? 'Gültigkeitszeitraum' : 'Reisezeitraum',
			value: formatBudgetPlan(permit.value),
		},
		{ key: 'Haushalt', value: formatBudget(budget.value) },
		...permit.value.budgetPlanItem
			? [ { key: 'Haushaltstitel', value: formatBudgetPlanItem(permit.value.budgetPlanItem) } ]
			: [ { key: 'Herkunft der Mittel', value: 'Rücklage' } ],
		{ key: 'Anlass', value: formatTravelPermitOccasion(permit.value.occasion) },
		{ key: 'Personenkreis', value: formatTravelPermitTravelerBasis(permit.value.travelerBasis) },
		{
			key: 'Besonderes Interesse',
			value: formatTravelPermitSpecialInterest(permit.value.specialInterest) +
				(permit.value.specialInterestReference
					? ` (${permit.value.specialInterestReference})`
					: ''),
		},
		{ key: 'Fernverkehr', value: permit.value.longDistance ? 'Ja' : 'Nein' },
		{ key: 'Kraftfahrzeug', value: formatTravelPermitCar(permit.value.car) },
		...permit.value.car === 'none'
			? []
			: [ {
				key: 'Parkgebühren',
				value: permit.value.parkingFeesAllowed ? 'werden erstattet' : 'werden nicht erstattet',
			} ],
		...permit.value.advanceAmount
			? [ { key: 'Vorschuss', value: formatCurrency(permit.value.advanceAmount) } ]
			: [],
		...deadline.value && claimable.value
			? [ { key: 'Erstattung zu beantragen bis', value: formatDate(deadline.value) } ]
			: [],
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
	caption="Reisende und genehmigte Kosten"
	:columns="[ 'person', { name: 'amount', width: '12em', class: 'numeric' } ]"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	:data="permit.travelers"
)
	template(#person-header)
		| Person
	template(#person-body="{ item }")
		| {{ formatPerson(item.person) }}{{ item.driver ? ' (fahrend)' : '' }}
	template(#amount-header)
		| Genehmigt
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.amount) }}
KernTable.mt-8(
	v-if="permit && permit.claims.length > 0"
	caption="Erstattungen"
	:columns="[ 'period', 'recipient', { name: 'amount', width: '12em', class: 'numeric' }, { name: 'payout', width: '12em', class: 'numeric' } ]"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	:data="permit.claims"
)
	template(#period-header)
		| Reise
	template(#period-body="{ item }")
		| {{ item.title ?? permit.title }} ({{ formatBudgetPlan(item) }})
		span.kern-body--small(v-if="item.late")
			| &nbsp;· verspätet
	template(#recipient-header)
		| Erstattung an
	template(#recipient-body="{ item }")
		| {{ formatPerson(item.recipientPerson) }}
	template(#amount-header)
		| Kosten
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.amount) }}
	template(#payout-header)
		| Auszahlung
	template(#payout-body="{ item }")
		| {{ formatCurrency(item.payoutAmount) }}
template(v-if="claimable && claimItems.length > 0")
	h2.kern-heading-medium.mt-8 Erstattung beantragen
	KernCardNav(:items="claimItems")
</template>
