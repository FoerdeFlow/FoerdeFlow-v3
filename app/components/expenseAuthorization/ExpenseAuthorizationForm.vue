<script setup lang="ts">
import type { Budget, BudgetPlanItem, ExpenseAuthorizationItemInput, KernTaskListItems } from '~/types'

type Tasks = KernTaskListItems[number]['tasks']

defineOptions({
	summaryItems: 3,
})

const props = defineProps<{
	selectedItem: string | null
	readonly?: boolean
	summaryOffset?: number
	meta?: { type?: 'planned' | 'reserve' }
	presets?: unknown
}>()

const presets = useProcessPresets(() => props.presets, () => props.readonly)

const type = computed(() =>
	typeof props.meta === 'object' && 'type' in props.meta && props.meta.type
		? props.meta.type
		: 'planned',
)

const emit = defineEmits<{
	select: [item: string]
}>()

interface Model {
	budgetPlanItem: BudgetPlanItem
	budget: Budget
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

const budgetField = computed(() => type.value === 'planned' ? 'budgetPlanItem' : 'budget')
const budgetFieldSet = computed(() => presets.fixed(budgetField.value) || (type.value === 'planned'
	? !!model.value.budgetPlanItem
	: !!model.value.budget))

defineExpose({
	title: 'Details zur Ausgabeermächtigung',
	tasks: computed<Tasks>(() => [
		...presets.visible(budgetField.value)
			? [ {
				id: 'expense-authorization-plan-item',
				label: type.value === 'planned'
					? 'Haushaltstitel auswählen'
					: 'Haushalt auswählen',
				status: budgetFieldSet.value ? 'done' : 'open',
			} ] satisfies Tasks
			: [],
		...presets.visible('title', 'description')
			? [ {
				id: 'expense-authorization-title',
				label: 'Ausgabeermächtigung beschreiben',
				status: model.value.title || presets.fixed('title')
					? 'done'
					: model.value.description ? 'partial' : 'open',
			} ] satisfies Tasks
			: [],
		...presets.visible('items')
			? [ {
				id: 'expense-authorization-amount-and-items',
				label: 'Kostenaufstellung hinzufügen',
				status: model.value.amount !== 0 || presets.fixed('items') ? 'done' : 'open',
			} ] satisfies Tasks
			: [],
	]),
})
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'expense-authorization-plan-item'")
	template(v-if="type === 'planned'")
		ExpenseAuthorizationBudgetPlanItemInput(
			v-if="presets.visible('budgetPlanItem')"
			v-model="model.budgetPlanItem"
			:readonly="presets.readonly('budgetPlanItem')"
		)
	template(v-else)
		ExpenseAuthorizationBudgetInput(
			v-if="presets.visible('budget')"
			v-model="model.budget"
			:readonly="presets.readonly('budget')"
		)
template(v-if="props.selectedItem === 'expense-authorization-title'")
	ExpenseAuthorizationTitleInput(
		v-if="presets.visible('title')"
		v-model="model.title"
		:readonly="presets.readonly('title')"
	)
	ExpenseAuthorizationDescriptionInput(
		v-if="presets.visible('description')"
		v-model="model.description"
		:readonly="presets.readonly('description')"
	)
template(v-if="props.selectedItem === 'expense-authorization-amount-and-items'")
	ExpenseAuthorizationAmountInput(
		v-model="model.amount"
		:readonly="true"
	)
	ExpenseAuthorizationItemsInput(
		v-model="model.items"
		:readonly="presets.readonly('items')"
	)
template(v-if="props.selectedItem === 'summary'")
	template(v-if="type === 'planned'")
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
	template(v-else)
		KernSummary(
			:number="(props.summaryOffset ?? 0) + 1"
			title="Angaben zum Haushalt"
			:items=`[
				{
					key: 'Haushalt',
					value: formatBudget(model.budget ?? null),
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
