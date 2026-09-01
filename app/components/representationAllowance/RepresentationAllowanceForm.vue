<script setup lang="ts">
import type {
	KernTaskListItems,
	RepresentationAllowancePeriodUnit,
	RepresentationAllowanceRecipientInput,
} from '~/types'

defineOptions({
	summaryItems: 2,
})

const props = defineProps<{
	selectedItem: string | null
	readonly?: boolean
	summaryOffset?: number
	meta?: unknown
}>()

const emit = defineEmits<{
	select: [item: string]
}>()

interface Model {
	title: string
	description: string | null
	periodUnit: RepresentationAllowancePeriodUnit
	startDate: Date | null
	endDate: Date | null
	recipients: RepresentationAllowanceRecipientInput[]
}

const model = defineModel<Model>({
	required: true,
})

const { t } = useI18n()

const total = computed(() => model.value.recipients
	.reduce((sum, recipient) => sum + (recipient.amount || 0), 0))

const limits = computed(() => model.value.periodUnit === 'once'
	? {
		perPerson: metaAmount(props.meta, 'maximumSingleAmountPerPerson'),
		total: metaAmount(props.meta, 'maximumSingleAmountTotal'),
	}
	: {
		perPerson: metaAmount(props.meta, 'maximumMonthlyAmountPerPerson'),
		total: metaAmount(props.meta, 'maximumMonthlyAmountTotal'),
	})

const recipientsAboveLimit = computed(() => {
	const perPerson = limits.value.perPerson
	if(perPerson === null) return []
	return model.value.recipients.filter((recipient) => recipient.amount > perPerson)
})

const totalAboveLimit = computed(() => {
	const limit = limits.value.total
	return limit !== null && total.value > limit
})

const violated = computed(() =>
	recipientsAboveLimit.value.length > 0 || totalAboveLimit.value)

const periodLabel = computed(() => {
	if(model.value.periodUnit === 'once') {
		return formatDate(model.value.startDate) || '–'
	}
	if(!model.value.startDate) return '–'
	return model.value.endDate
		? formatBudgetPlan({
			startDate: model.value.startDate,
			endDate: model.value.endDate,
		})
		: `ab ${formatDate(model.value.startDate, 'compact')} (unbefristet)`
})

defineExpose({
	title: 'Details zur Aufwandsentschädigung',
	tasks: computed(() => [
		{
			id: 'representation-allowance-title',
			label: 'Aufwandsentschädigung beschreiben',
			status: model.value.title && model.value.startDate
				? 'done'
				: model.value.title || model.value.startDate || model.value.description
					? 'partial'
					: 'open',
		},
		{
			id: 'representation-allowance-recipients',
			label: 'Empfänger*innen hinzufügen',
			status: recipientsAboveLimit.value.length > 0 || totalAboveLimit.value
				? 'partial'
				: model.value.recipients.length > 0 && model.value.recipients
					.every((recipient) => recipient.person && recipient.amount > 0)
					? 'done'
					: model.value.recipients.length > 0
						? 'partial'
						: 'open',
		},
	] satisfies KernTaskListItems[number]['tasks']),
})

function recipientSummary(recipient: RepresentationAllowanceRecipientInput) {
	const amount = formatCurrency(recipient.amount)
	return model.value.periodUnit === 'once'
		? amount
		: t('representationAllowance.summary.perMonth', { amount })
}

const limitItems = computed(() => {
	const key = model.value.periodUnit === 'once' ? 'single' : 'monthly'
	return [
		limits.value.perPerson === null
			? null
			: {
				key: t(`representationAllowance.limit.${key}PerPerson`),
				value: formatCurrency(limits.value.perPerson),
			},
		limits.value.total === null
			? null
			: {
				key: t(`representationAllowance.limit.${key}Total`),
				value: formatCurrency(limits.value.total),
			},
	].filter((item) => item !== null)
})

const limitBullets = computed(() =>
	limitItems.value.map((limit) => `${limit.key}: ${limit.value}`))

const violationText = computed(() => {
	const messages = []
	if(recipientsAboveLimit.value.length > 0) {
		messages.push(t('representationAllowance.limit.perPersonExceeded', {
			amount: formatCurrency(limits.value.perPerson ?? 0),
			names: recipientsAboveLimit.value
				.map((recipient) => formatPerson(recipient.person) || '?')
				.join(', '),
		}))
	}
	if(totalAboveLimit.value) {
		messages.push(t('representationAllowance.limit.totalExceeded', {
			amount: formatCurrency(limits.value.total ?? 0),
			total: formatCurrency(total.value),
		}))
	}
	return messages.join(' ')
})
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'representation-allowance-title'")
	RepresentationAllowanceTitleInput(
		v-model="model.title"
		:readonly="props.readonly"
	)
	RepresentationAllowanceDescriptionInput(
		v-model="model.description"
		:readonly="props.readonly"
	)
	RepresentationAllowancePeriodUnitInput(
		v-model="model.periodUnit"
		:readonly="props.readonly"
	)
	.kern-fieldset__body.kern-fieldset__body--horizontal
		RepresentationAllowanceStartDateInput.flex-1(
			v-model="model.startDate"
			:period-unit="model.periodUnit"
			:readonly="props.readonly"
		)
		RepresentationAllowanceEndDateInput.flex-1(
			v-if="model.periodUnit !== 'once'"
			v-model="model.endDate"
			:readonly="props.readonly"
		)
template(v-if="props.selectedItem === 'representation-allowance-recipients'")
	KernAlert(
		v-if="violated"
		type="danger"
		:dismissible="false"
		:title="$t('representationAllowance.limit.exceededTitle')"
		:text="violationText"
	)
	KernAlert(
		v-else-if="limitBullets.length > 0"
		type="info"
		:dismissible="false"
		:title="$t('representationAllowance.limit.title')"
		:items="limitBullets"
	)
	RepresentationAllowanceRecipientsInput(
		v-model="model.recipients"
		:period-unit="model.periodUnit"
	)
template(v-if="props.selectedItem === 'summary'")
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 1"
		title="Beschreibung der Aufwandsentschädigung"
		:items=`[
			{
				key: 'Bezeichnung',
				value: model.title || '–',
			},
			{
				key: 'Erläuterung',
				value: model.description || '–',
			},
			{
				key: 'Art der Zahlung',
				value: $t('representationAllowance.periodUnit.' + model.periodUnit),
			},
			{
				key: model.periodUnit === 'once' ? 'Datum der Zahlung' : 'Laufzeit',
				value: periodLabel,
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'representation-allowance-title')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 2"
		title="Empfänger*innen"
		:items=`[
			{
				key: 'Gesamtbetrag',
				value: model.periodUnit === 'once'
					? formatCurrency(total)
					: $t('representationAllowance.summary.perMonth', { amount: formatCurrency(total) }),
			},
			...limitItems,
			...(model.recipients.length === 0
				? [
					{
						key: 'Empfänger*innen',
						value: '–',
					},
				]
				: model.recipients.map((recipient) => ({
					key: 'davon: ' + (formatPerson(recipient.person) || '–'),
					value: recipientSummary(recipient),
				}))
			),
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'representation-allowance-recipients')"
	)
</template>
