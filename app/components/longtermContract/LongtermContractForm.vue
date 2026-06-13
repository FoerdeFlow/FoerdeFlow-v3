<script setup lang="ts">
import type { Budget, KernTaskListItems, LongtermContractItemInput } from '~/types'

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
	title: string
	description: string | null
	startDate: Date | null
	endDate: Date | null
	items: LongtermContractItemInput[]
}

const model = defineModel<Model>({
	required: true,
})

const { t } = useI18n()

defineExpose({
	title: 'Details zum Langzeitvertrag',
	tasks: computed(() => [
		{
			id: 'longterm-contract-budget',
			label: 'Haushalt auswählen',
			status: model.value.budget ? 'done' : 'open',
		},
		{
			id: 'longterm-contract-title',
			label: 'Langzeitvertrag beschreiben',
			status: model.value.title && model.value.startDate
				? 'done'
				: model.value.title || model.value.startDate || model.value.description
					? 'partial'
					: 'open',
		},
		{
			id: 'longterm-contract-items',
			label: 'Kostenaufstellung hinzufügen',
			status: model.value.items.length > 0 ? 'done' : 'open',
		},
	] satisfies KernTaskListItems[number]['tasks']),
})

function formatItemAmount(item: Omit<LongtermContractItemInput, 'id'>) {
	const timeUnit = item.timeUnit ? t(`longtermContractItem.timeUnit.${item.timeUnit}`) : ''
	switch(item.type) {
		case 'time':
			return t('longtermContractItem.amount.time', {
				amount: formatCurrency(item.amount),
				timeUnit,
			})
		case 'usage':
			return t('longtermContractItem.amount.usage', {
				amount: formatCurrency(item.amount),
				usageUnit: item.usageUnit ?? '',
				expectedUsage: item.expectedUsage ?? 0,
				timeUnit,
			})
		case 'fixed':
			return t('longtermContractItem.amount.fixed', {
				amount: formatCurrency(item.amount),
			})
	}
}

function getItemSummaryDescription(item: Omit<LongtermContractItemInput, 'id'>): string {
	const amount = formatItemAmount(item)
	return item.description ? `${amount} (${item.description})` : amount
}
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'longterm-contract-budget'")
	LongtermContractBudgetInput(
		v-model="model.budget"
		:readonly="props.readonly"
	)
template(v-if="props.selectedItem === 'longterm-contract-title'")
	LongtermContractTitleInput(
		v-model="model.title"
		:readonly="props.readonly"
	)
	LongtermContractDescriptionInput(
		v-model="model.description"
		:readonly="props.readonly"
	)
	.kern-fieldset__body.kern-fieldset__body--horizontal
		LongtermContractStartDateInput.flex-1(
			v-model="model.startDate"
			:readonly="props.readonly"
		)
		LongtermContractEndDateInput.flex-1(
			v-model="model.endDate"
			:readonly="props.readonly"
		)
template(v-if="props.selectedItem === 'longterm-contract-items'")
	LongtermContractItemsInput(v-model="model.items")
template(v-if="props.selectedItem === 'summary'")
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
		@click.prevent="emit('select', 'longterm-contract-budget')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 2"
		title="Beschreibung des Langzeitvertrags"
		:items=`[
			{
				key: 'Titel',
				value: model.title || '–',
			},
			{
				key: 'Beschreibung',
				value: model.description || '–',
			},
			{
				key: 'Vertragsbeginn',
				value: formatDate(model.startDate) || '–',
			},
			{
				key: 'Vertragsende',
				value: model.endDate ? formatDate(model.endDate) : 'unbefristet',
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'longterm-contract-title')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 3"
		title="Kostenaufstellung"
		:items=`[
			...(model.items.length === 0
				? [
					{
						key: 'Kostenaufstellung',
						value: '–',
					},
				]
				: model.items.map((item) => ({
					key: item.title,
					value: getItemSummaryDescription(item),
				}))
			),
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'longterm-contract-items')"
	)
</template>
