<script setup lang="ts">
import type { TravelClaimFormModel } from '~/types'

defineOptions({
	summaryItems: 2,
})

const props = defineProps<{
	selectedItem: string | null
	readonly?: boolean
	summaryOffset?: number
	meta?: unknown
	presets?: unknown
}>()

const presets = useProcessPresets(() => props.presets, () => props.readonly)

const emit = defineEmits<{
	select: [item: string]
}>()

const model = defineModel<TravelClaimFormModel>({
	required: true,
})

const amounts = computed(() => travelClaimAmounts(model.value.permit?.items ?? [], model.value.items))

const payout = computed(() =>
	currencySum(amounts.value.amount, -(model.value.permit?.advance?.amount ?? 0)))

const deadline = computed(() => model.value.permit
	? formatDate(travelClaimDeadline(model.value.permit.endDate))
	: null)
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'travel-claim-permit'")
	TravelPermitSelectInput(
		v-if="presets.visible('permit')"
		v-model="model.permit"
		purpose="claim"
		:readonly="presets.readonly('permit')"
	)
	p.kern-body(v-if="deadline && !props.readonly")
		| Die Erstattung ist bis zum {{ deadline }} zu beantragen.
template(v-if="props.selectedItem === 'travel-claim-items' && model.permit")
	TravelClaimItemsInput(
		v-model="model.items"
		:permit="model.permit"
		:readonly="presets.readonly('items')"
	)
template(v-if="props.selectedItem === 'summary'")
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 1"
		title="Dienstreise"
		:items=`[
			{ key: 'Dienstreise', value: model.permit?.title ?? '–' },
			{ key: 'Zeitraum', value: model.permit ? formatDate(model.permit.startDate) + ' bis ' + formatDate(model.permit.endDate) : '–' },
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-claim-permit')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 2"
		title="Kosten"
		:items=`[
			{ key: 'Tatsächliche Kosten', value: formatCurrency(amounts.requestedAmount, 'amount') },
			{ key: 'Erstattungsfähig', value: formatCurrency(amounts.amount, 'amount') },
			...(model.permit?.advance
				? [ { key: 'Vorschuss', value: formatCurrency(model.permit.advance.amount, 'amount') } ]
				: []),
			{ key: payout < 0 ? 'Zurückzuzahlen' : 'Auszuzahlen', value: formatCurrency(Math.abs(payout), 'amount') },
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-claim-items')"
	)
</template>
