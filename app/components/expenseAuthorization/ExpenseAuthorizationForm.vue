<script setup lang="ts">
import type { ExpenseAuthorizationFormModel } from '~/types'

defineOptions({
	summaryItems: 3,
})

const props = defineProps<{
	selectedItem: string | null
	readonly?: boolean
	summaryOffset?: number
	meta?: { type?: 'planned' | 'reserve', allowPendingBudgetPlan?: boolean }
	/** The organization item whose budgets may be picked, if it is restricted. */
	organizationItem?: string | null
	presets?: unknown
}>()

const presets = useProcessPresets(() => props.presets, () => props.readonly)

const type = computed(() => expenseAuthorizationType(props.meta))
const pending = computed(() => expenseAuthorizationAllowsPendingBudgetPlan(props.meta))

const emit = defineEmits<{
	select: [item: string]
}>()

const model = defineModel<ExpenseAuthorizationFormModel>({
	required: true,
})

watch(() => model.value.items, (items) => {
	model.value.amount = items.reduce((sum, item) => sum + item.amount, 0)
}, { deep: true })
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'expense-authorization-plan-item'")
	template(v-if="type === 'planned'")
		ExpenseAuthorizationBudgetPlanItemInput(
			v-if="presets.visible('budgetPlanItem')"
			v-model="model.budgetPlanItem"
			:pending="pending"
			:organization-item="props.organizationItem"
			:readonly="presets.readonly('budgetPlanItem')"
		)
	template(v-else)
		ExpenseAuthorizationBudgetInput(
			v-if="presets.visible('budget')"
			v-model="model.budget"
			:organization-item="props.organizationItem"
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
					value: formatBudgetPlan(model.budgetPlanItem?.plan ?? null) +
						(model.budgetPlanItem && 'pending' in model.budgetPlanItem
							? ' (beantragt)'
							: ''),
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
