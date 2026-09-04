<script setup lang="ts">
import type { BudgetPlanFormModel, BudgetPlanItemInput } from '~/types'

defineOptions({
	summaryItems: 3,
})

const props = defineProps<{
	selectedItem: string | null
	readonly?: boolean
	summaryOffset?: number
	presets?: unknown
}>()

const presets = useProcessPresets(() => props.presets, () => props.readonly)

const emit = defineEmits<{
	select: [item: string]
}>()

const model = defineModel<BudgetPlanFormModel>({
	required: true,
})

function getBudgetItemSummaryDescription(item: BudgetPlanItemInput): string {
	const parts = []
	if(item.revenues) parts.push(`Einnahmen: ${formatCurrency(item.revenues)}`)
	if(item.expenses) parts.push(`Ausgaben: ${formatCurrency(item.expenses)}`)
	const meta = parts.join(', ')
	return item.description ? `${meta} (${item.description})` : meta
}
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'budget-plan-meta'")
	BudgetPlanBudgetInput(
		v-if="presets.visible('budget')"
		v-model="model.budget"
		:readonly="presets.readonly('budget')"
	)
	BudgetPlanPeriodInput(
		v-if="model.budget && presets.visible('startDate', 'endDate')"
		v-model:start-date="model.startDate"
		v-model:end-date="model.endDate"
		:period-type="model.budget.periodType"
		:readonly="presets.readonly('startDate', 'endDate')"
	)
template(v-if="props.selectedItem === 'budget-plan-items'")
	BudgetPlanItemsInput(
		v-model="model.items"
		:readonly="presets.readonly('items')"
	)
template(v-if="props.selectedItem === 'summary'")
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 1"
		title="Angaben zum Haushalt"
		:items=`[
			{
				key: 'Haushalt',
				value: formatBudget(model.budget ?? null),
			},
			{
				key: 'Haushaltsperiode',
				value: formatBudgetPlan(model),
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'budget-plan-meta')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 2"
		title="Haushaltstitel"
		:items=`[
			...(model.items.length === 0
				? [
					{
						key: 'Haushaltsplan',
						value: '–',
					},
				]
				: model.items.map((item) => ({
					key: item.title,
					value: getBudgetItemSummaryDescription(item),
				}))
			),
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'budget-plan-items')"
	)
</template>
