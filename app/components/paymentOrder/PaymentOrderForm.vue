<script setup lang="ts">
import type { PaymentOrderFormModel } from '~/types'

defineOptions({
	summaryItems: 4,
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

const model = defineModel<PaymentOrderFormModel>({
	required: true,
})

/** The plan the payment is made from, which is what the selects filter by. */
const budgetPlan = computed(() => model.value.budgetPlanItem?.plan?.id ?? null)
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'payment-order-source'")
	PaymentOrderTypeInput(
		v-if="presets.visible('type')"
		v-model="model.type"
		:readonly="presets.readonly('type')"
	)
	PaymentOrderBudgetPlanItemInput(
		v-if="model.type === 'planned' && presets.visible('budgetPlanItem')"
		v-model="model.budgetPlanItem"
		:readonly="presets.readonly('budgetPlanItem')"
	)
	PaymentOrderBudgetInput(
		v-if="model.type === 'reserve' && presets.visible('budget')"
		v-model="model.budget"
		:readonly="presets.readonly('budget')"
	)
	PaymentOrderExpenseAuthorizationInput(
		v-if="presets.visible('expenseAuthorization')"
		v-model="model.expenseAuthorization"
		:budget-plan="model.type === 'planned' ? budgetPlan : null"
		:budget="model.type === 'planned' ? null : model.budget?.id ?? null"
		:readonly="presets.readonly('expenseAuthorization')"
	)
template(v-if="props.selectedItem === 'payment-order-recipient'")
	PaymentOrderRecipientTypeInput(
		v-if="presets.visible('recipientType')"
		v-model="model.recipientType"
		:readonly="presets.readonly('recipientType')"
	)
	PaymentOrderRecipientPersonInput(
		v-if="model.recipientType === 'reimbursement' && presets.visible('recipientPerson')"
		v-model="model.recipientPerson"
		:readonly="presets.readonly('recipientPerson')"
	)
	template(v-if="model.recipientType === 'invoice'")
		PaymentOrderRecipientNameInput(
			v-if="presets.visible('recipientName')"
			v-model="model.recipientName"
			:readonly="presets.readonly('recipientName')"
		)
		PaymentOrderRecipientIbanInput(
			v-if="presets.visible('recipientIban')"
			v-model="model.recipientIban"
			:readonly="presets.readonly('recipientIban')"
		)
		PaymentOrderPurposeInput(
			v-if="presets.visible('purpose')"
			v-model="model.purpose"
			:readonly="presets.readonly('purpose')"
		)
template(v-if="props.selectedItem === 'payment-order-title'")
	PaymentOrderTitleInput(
		v-if="presets.visible('title')"
		v-model="model.title"
		:readonly="presets.readonly('title')"
	)
	PaymentOrderDescriptionInput(
		v-if="presets.visible('description')"
		v-model="model.description"
		:readonly="presets.readonly('description')"
	)
template(v-if="props.selectedItem === 'payment-order-amount'")
	PaymentOrderAmountInput(
		v-if="presets.visible('amount')"
		v-model="model.amount"
		:readonly="presets.readonly('amount')"
	)
template(v-if="props.selectedItem === 'summary'")
	template(v-if="model.type === 'planned'")
		KernSummary(
			:number="(props.summaryOffset ?? 0) + 1"
			title="Angaben zur Herkunft"
			:items=`[
				{
					key: 'Herkunft der Mittel',
					value: $t('paymentOrder.type.planned'),
				},
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
				{
					key: 'Ausgabeermächtigung',
					value: model.expenseAuthorization?.title || '–',
				},
			]`
			:readonly="props.readonly"
			@click.prevent="emit('select', 'payment-order-source')"
		)
	template(v-else)
		KernSummary(
			:number="(props.summaryOffset ?? 0) + 1"
			title="Angaben zur Herkunft"
			:items=`[
				{
					key: 'Herkunft der Mittel',
					value: $t('paymentOrder.type.reserve'),
				},
				{
					key: 'Haushalt',
					value: formatBudget(model.budget ?? null),
				},
				{
					key: 'Ausgabeermächtigung',
					value: model.expenseAuthorization?.title || '–',
				},
			]`
			:readonly="props.readonly"
			@click.prevent="emit('select', 'payment-order-source')"
		)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 2"
		title="Angaben zur Empfänger*in"
		:items=`model.recipientType === 'reimbursement'
			? [
				{
					key: 'Art der Zahlung',
					value: $t('paymentOrder.recipientType.reimbursement'),
				},
				{
					key: 'Empfangendes Mitglied',
					value: formatPerson(model.recipientPerson ?? null, 'long') || '–',
				},
			]
			: [
				{
					key: 'Art der Zahlung',
					value: $t('paymentOrder.recipientType.invoice'),
				},
				{
					key: 'Empfänger*in',
					value: model.recipientName || '–',
				},
				{
					key: 'IBAN',
					value: formatIban(model.recipientIban) || '–',
				},
				{
					key: 'Verwendungszweck',
					value: model.purpose || '–',
				},
			]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'payment-order-recipient')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 3"
		title="Beschreibung der Zahlungsanweisung"
		:items=`[
			{
				key: 'Bezeichnung',
				value: model.title || '–',
			},
			{
				key: 'Erläuterung',
				value: model.description || '–',
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'payment-order-title')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 4"
		title="Betrag"
		:items=`[
			{
				key: 'Anzuweisender Betrag',
				value: formatCurrency(model.amount),
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'payment-order-amount')"
	)
</template>
