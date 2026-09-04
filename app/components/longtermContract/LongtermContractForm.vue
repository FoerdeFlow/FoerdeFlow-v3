<script setup lang="ts">
import type { LongtermContractFormModel, LongtermContractItemInput } from '~/types'

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

const model = defineModel<LongtermContractFormModel>({
	required: true,
})

const { t } = useI18n()

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
		v-if="presets.visible('budget')"
		v-model="model.budget"
		:readonly="presets.readonly('budget')"
	)
template(v-if="props.selectedItem === 'longterm-contract-title'")
	LongtermContractTitleInput(
		v-if="presets.visible('title')"
		v-model="model.title"
		:readonly="presets.readonly('title')"
	)
	LongtermContractDescriptionInput(
		v-if="presets.visible('description')"
		v-model="model.description"
		:readonly="presets.readonly('description')"
	)
	.kern-fieldset__body.kern-fieldset__body--horizontal
		LongtermContractStartDateInput.flex-1(
			v-if="presets.visible('startDate')"
			v-model="model.startDate"
			:readonly="presets.readonly('startDate')"
		)
		LongtermContractEndDateInput.flex-1(
			v-if="presets.visible('endDate')"
			v-model="model.endDate"
			:readonly="presets.readonly('endDate')"
		)
template(v-if="props.selectedItem === 'longterm-contract-items'")
	LongtermContractItemsInput(
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
