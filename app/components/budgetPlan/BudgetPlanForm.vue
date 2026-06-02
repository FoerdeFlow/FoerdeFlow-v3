<script setup lang="ts">
import type { Budget, BudgetPlanItemInput, KernTaskListItems } from '~/types'

defineOptions({
	summaryItems: 3,
})

const props = defineProps<{
	selectedItem: string | null
	readonly?: boolean
	summaryOffset?: number
}>()

const emit = defineEmits<{
	select: [item: string]
}>()

interface Model {
	budget: Budget
	startDate: Date | null
	endDate: Date | null
	items: BudgetPlanItemInput[]
}

const model = defineModel<Model>({
	required: true,
})

defineExpose({
	title: 'Details zum Haushaltsplan',
	tasks: computed(() => [
		{
			id: 'budget-plan-meta',
			label: 'Haushalt auswählen',
			status: model.value.budget ? 'done' : 'open',
		},
		{
			id: 'budget-plan-items',
			label: 'Haushaltstitel hinzufügen',
			status: model.value.items.length > 0
				? model.value.items.every((item) => item.title) &&
					model.value.items.reduce(
						(sum, item) => sum + (item.revenues ?? 0) - (item.expenses ?? 0), 0,
					) === 0
					? 'done'
					: 'partial'
				: 'open',
		},
	] satisfies KernTaskListItems[number]['tasks']),
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
		v-model="model.budget"
		:readonly="props.readonly"
	)
	BudgetPlanPeriodInput(
		v-if="model.budget"
		v-model:start-date="model.startDate"
		v-model:end-date="model.endDate"
		:period-type="model.budget.periodType"
		:readonly="props.readonly"
	)
template(v-if="props.selectedItem === 'budget-plan-items'")
	BudgetPlanItemsInput(v-model="model.items")
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
