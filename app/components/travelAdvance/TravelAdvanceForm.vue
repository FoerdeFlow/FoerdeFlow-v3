<script setup lang="ts">
import type { TravelAdvanceFormModel } from '~/types'

defineOptions({
	summaryItems: 1,
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

const model = defineModel<TravelAdvanceFormModel>({
	required: true,
})

const maximumAmount = computed(() => model.value.permit
	? travelAdvanceMaximum(model.value.permit.amount, props.meta)
	: null)

const hint = computed(() => model.value.permit && maximumAmount.value !== null
	? `Höchstens ${formatCurrency(maximumAmount.value, 'amount')} bei voraussichtlichen Kosten ` +
		`von ${formatCurrency(model.value.permit.amount, 'amount')}.`
	: undefined)
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'travel-advance'")
	TravelPermitSelectInput(
		v-if="presets.visible('permit')"
		v-model="model.permit"
		purpose="advance"
		:readonly="presets.readonly('permit')"
	)
	KernCurrencyInput(
		v-if="presets.visible('amount')"
		v-model="model.amount"
		label="Höhe des Vorschusses"
		:hint="hint"
		:readonly="presets.readonly('amount')"
	)
template(v-if="props.selectedItem === 'summary'")
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 1"
		title="Vorschuss"
		:items=`[
			{ key: 'Dienstreise', value: model.permit?.title ?? '–' },
			{ key: 'Voraussichtliche Kosten', value: formatCurrency(model.permit?.amount ?? 0, 'amount') },
			{ key: 'Vorschuss', value: formatCurrency(model.amount, 'amount') },
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-advance')"
	)
</template>
