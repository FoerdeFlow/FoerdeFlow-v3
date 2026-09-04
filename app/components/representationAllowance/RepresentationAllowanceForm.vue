<script setup lang="ts">
import type {
	RepresentationAllowanceFormModel,
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
	presets?: unknown
}>()

const presets = useProcessPresets(() => props.presets, () => props.readonly)

const emit = defineEmits<{
	select: [item: string]
}>()

const model = defineModel<RepresentationAllowanceFormModel>({
	required: true,
})

const { t } = useI18n()

const limitState = computed(() => representationAllowanceLimits(model.value, props.meta))

const total = computed(() => limitState.value.total)
const limits = computed(() => limitState.value.limits)
const recipientsAboveLimit = computed(() => limitState.value.recipientsAboveLimit)
const totalAboveLimit = computed(() => limitState.value.totalAboveLimit)
const violated = computed(() => limitState.value.violated)

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
		v-if="presets.visible('title')"
		v-model="model.title"
		:readonly="presets.readonly('title')"
	)
	RepresentationAllowanceDescriptionInput(
		v-if="presets.visible('description')"
		v-model="model.description"
		:readonly="presets.readonly('description')"
	)
	RepresentationAllowancePeriodUnitInput(
		v-if="presets.visible('periodUnit')"
		v-model="model.periodUnit"
		:readonly="presets.readonly('periodUnit')"
	)
	.kern-fieldset__body.kern-fieldset__body--horizontal
		RepresentationAllowanceStartDateInput.flex-1(
			v-if="presets.visible('startDate')"
			v-model="model.startDate"
			:period-unit="model.periodUnit"
			:readonly="presets.readonly('startDate')"
		)
		RepresentationAllowanceEndDateInput.flex-1(
			v-if="model.periodUnit !== 'once' && presets.visible('endDate')"
			v-model="model.endDate"
			:readonly="presets.readonly('endDate')"
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
		:readonly="presets.readonly('recipients')"
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
