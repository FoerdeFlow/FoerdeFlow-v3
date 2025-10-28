<script setup lang="ts">
import type { BudgetPlanItem, ExpenseAuthorizationItemInput, KernTaskListItems } from '~/types'

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
	budgetPlanItem: BudgetPlanItem
	title: string
	description: string | null
	amount: number
	items: ExpenseAuthorizationItemInput[]
}

const model = defineModel<Model>({
	required: true,
})

watch(() => model.value.items, (items) => {
	model.value.amount = items.reduce((sum, item) => sum + item.amount, 0)
}, { deep: true })

defineExpose({
	title: 'Details zur Ausgabeermächtigung',
	tasks: computed(() => [
		{
			id: 'expense-authorization-plan-item',
			label: 'Haushaltstitel auswählen',
			status: model.value.budgetPlanItem ? 'done' : 'open',
		},
		{
			id: 'expense-authorization-title',
			label: 'Ausgabeermächtigung beschreiben',
			status: model.value.title ? 'done' : model.value.description ? 'partial' : 'open',
		},
		{
			id: 'expense-authorization-amount-and-items',
			label: 'Kostenaufstellung hinzufügen',
			status: model.value.amount !== 0 ? 'done' : 'open',
		},
	] satisfies KernTaskListItems[number]['tasks']),
})
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'expense-authorization-plan-item'")
	ExpenseAuthorizationBudgetPlanItemInput(
		v-model="model.budgetPlanItem"
		:readonly="props.readonly"
	)
template(v-if="props.selectedItem === 'expense-authorization-title'")
	ExpenseAuthorizationTitleInput(
		v-model="model.title"
		:readonly="props.readonly"
	)
	ExpenseAuthorizationDescriptionInput(
		v-model="model.description"
		:readonly="props.readonly"
	)
template(v-if="props.selectedItem === 'expense-authorization-amount-and-items'")
	ExpenseAuthorizationAmountInput(
		v-model="model.amount"
		:readonly="true"
	)
	ExpenseAuthorizationItemsInput(v-model="model.items")
template(v-if="props.selectedItem === 'summary'")
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 1"
		title="Angaben zum Haushaltstitel"
		:items=`[
			{
				key: 'Haushalt',
				value: formatBudget(model.budgetPlanItem?.plan?.budget ?? null),
			},
			{
				key: 'Haushaltsplan',
				value: formatBudgetPlan(model.budgetPlanItem?.plan ?? null),
			},
			{
				key: 'Haushaltstitel',
				value: formatBudgetPlanItem(model.budgetPlanItem ?? null),
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'expense-authorization-plan-item')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 2"
		title="Beschreibung der Ausgabeermächtigung"
		:items=`[
			{
				key: 'Titel',
				value: model.title || '–',
			},
			{
				key: 'Beschreibung',
				value: model.description || '–',
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'expense-authorization-plan-item')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 3"
		title="Betrag und Kostenaufstellung"
		:items=`[
			{
				key: 'Gesamtbetrag',
				value: formatCurrency(model.amount),
			},
			...(model.items.length === 0
				? [
					{
						key: 'Kostenaufstellung',
						value: '–',
					},
				]
				: model.items.map((item) => ({
					key: 'davon: ' + item.title,
					value: formatCurrency(item.amount) +
						(item.description ? ' (' + item.description + ')' : ''),
				}))
			),
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'expense-authorization-plan-item')"
	)
</template>
