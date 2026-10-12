<script setup lang="ts">
import type { TravelClaimFormModel } from '~/types'

defineOptions({
	summaryItems: 2,
})

const props = defineProps<{
	selectedItem: string | null
	readonly?: boolean
	summaryOffset?: number
	meta?: unknown
	presets?: unknown
	processId?: string
	mutationId?: string
}>()

const presets = useProcessPresets(() => props.presets, () => props.readonly)

const emit = defineEmits<{
	select: [item: string]
}>()

const model = defineModel<TravelClaimFormModel>({
	required: true,
})

const authStore = useAuthStore()

// Only offered while the claim is written, a claim that was sent shows the
// permit it was made on.
const { data: permits } = useFetch('/api/travelPermits', {
	immediate: !props.readonly,
})

/**
 * The permits a claim can still be made on: a single journey is settled by a
 * single claim, while a general permit carries one claim per journey.
 */
const permitOptions = computed(() => (permits.value ?? [])
	.filter((permit) => permit.kind === 'general' || permit.claims.length === 0)
	.map((permit) => ({
		value: permit.id,
		label: `${permit.title} (${formatBudgetPlan(permit)})`,
	})))

const permitId = computed({
	get: () => model.value.permit?.id ?? '',
	set: (id: string) => {
		const permit = (permits.value ?? []).find((item) => item.id === id) ?? null
		model.value.permit = permit
		if(!permit) return

		const own = authStore.userInfo.person?.id
		const travelers = permit.travelers.map((traveler) => traveler.person.id)
		if(!model.value.recipientPerson || !travelers.includes(model.value.recipientPerson)) {
			model.value.recipientPerson = own && travelers.includes(own) ? own : travelers[0] ?? null
		}
		// A single permit names its journey, which is offered as it was
		// approved. A general one leaves each journey to be filled in.
		if(permit.kind === 'single') {
			model.value.startDate = new Date(permit.startDate)
			model.value.endDate = new Date(permit.endDate)
			model.value.title = null
			model.value.destination = null
		}
		model.value.items = model.value.items
			.filter((item) => !item.traveler || travelers.includes(item.traveler))
	},
})

const general = computed(() => model.value.permit?.kind === 'general')

const rules = computed(() => travelMeta(props.meta))

const travelerOptions = computed(() => (model.value.permit?.travelers ?? [])
	.filter((traveler) => traveler.person?.id)
	.map((traveler) => ({ value: traveler.person?.id ?? '', label: formatPerson(traveler.person) })))

const recipientId = computed({
	get: () => model.value.recipientPerson ?? '',
	set: (id: string) => {
		model.value.recipientPerson = id || null
	},
})

const approved = computed(() => Object.fromEntries((model.value.permit?.travelers ?? [])
	.filter((traveler) => traveler.person?.id)
	.map((traveler) => [ traveler.person?.id ?? '', traveler.amount ])))

const limits = computed(() => travelClaimLimits(
	model.value.items.map((item) => ({
		traveler: item.traveler,
		category: item.category,
		amount: item.amount,
		event: item.event,
	})),
	approved.value,
	props.meta,
))

const advance = computed(() => general.value ? 0 : model.value.permit?.advanceAmount ?? 0)
const payout = computed(() => currencySum(limits.value.total, -advance.value))

const deadline = computed(() => model.value.endDate
	? travelClaimDeadline(model.value.endDate, rules.value.claimDeadlineDays)
	: null)
const late = computed(() => !props.readonly && !!model.value.endDate &&
	travelClaimLate(model.value.endDate, rules.value.claimDeadlineDays))

const violationItems = computed(() => [
	...limits.value.personsAboveApproval.map((entry) =>
		`${travelerName(entry.person)}: ${formatCurrency(entry.amount)} abgerechnet, ` +
		`${formatCurrency(entry.approved)} genehmigt. Erstattet wird höchstens der genehmigte Betrag.`),
	...limits.value.eventsAboveLimit.map((entry) =>
		`${travelerName(entry.traveler)}: ${formatCurrency(entry.amount)} für „${entry.event}“, ` +
		`höchstens ${formatCurrency(rules.value.maximumEventAmountPerPerson)} je Veranstaltung (§ 8).`),
])

function travelerName(id: string) {
	return travelerOptions.value.find((option) => option.value === id)?.label ?? '?'
}

const journeyPeriod = computed(() => model.value.startDate && model.value.endDate
	? formatBudgetPlan({ startDate: model.value.startDate, endDate: model.value.endDate })
	: '–')

const lateText = computed(() => `Der Antrag war bis zum ${formatDate(deadline.value)} ` +
	'einzureichen (§ 4). Er kann trotzdem gestellt werden, wird aber als verspätet markiert.')

const carsharingHint = 'Die Carsharing-Fahrten selbst werden per Sammelrechnung beglichen; ' +
	'abzurechnen sind nur eigene Auslagen wie Tanken oder Laden.'

function attachmentUrl(name: string) {
	return `/api/processes/${props.processId}/attachments/${props.mutationId}_${name}`
}
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'travel-claim-journey'")
	TravelSelectInput(
		v-if="!props.readonly && presets.visible('permit')"
		v-model="permitId"
		label="Dienstreisegenehmigung"
		hint="Die Genehmigung ist dem Antrag zugrunde zu legen (§ 4)."
		:options="permitOptions"
		:readonly="presets.readonly('permit')"
	)
	KernAlert(
		v-if="!props.readonly && permits && permitOptions.length === 0"
		type="info"
		:dismissible="false"
		title="Keine offene Genehmigung"
		text="Es liegt keine Dienstreisegenehmigung vor, zu der noch eine Erstattung beantragt werden kann."
	)
	template(v-if="model.permit")
		TravelSelectInput(
			v-if="presets.visible('recipientPerson')"
			v-model="recipientId"
			label="Erstattung an"
			hint="Die Erstattung wird auf die hinterlegte Bankverbindung dieser Person überwiesen."
			:options="travelerOptions"
			:readonly="presets.readonly('recipientPerson')"
		)
		template(v-if="general")
			TravelTextInput(
				v-if="presets.visible('title')"
				v-model="model.title"
				label="Dienstgeschäft"
				:readonly="presets.readonly('title')"
			)
			TravelTextInput(
				v-if="presets.visible('destination')"
				v-model="model.destination"
				label="Reiseziel"
				:readonly="presets.readonly('destination')"
			)
		.kern-fieldset__body.kern-fieldset__body--horizontal
			TravelDateInput.flex-1(
				v-if="presets.visible('startDate')"
				v-model="model.startDate"
				label="Beginn der Reise"
				:readonly="presets.readonly('startDate')"
			)
			TravelDateInput.flex-1(
				v-if="presets.visible('endDate')"
				v-model="model.endDate"
				label="Ende der Reise"
				:readonly="presets.readonly('endDate')"
			)
		KernAlert(
			v-if="late"
			type="warning"
			:dismissible="false"
			title="Frist abgelaufen"
			:text="lateText"
		)
template(v-if="props.selectedItem === 'travel-claim-items'")
	template(v-if="model.permit")
		KernAlert(
			type="info"
			:dismissible="false"
			title="Hinweise zur Abrechnung"
			:items=`[
				'Fahrten, die durch das Semesterticket abgedeckt sind, werden nicht erstattet (§ 6 Abs. 1).',
				'Erstattet werden nur tatsächlich entstandene und belegte Kosten (§ 5 Abs. 2).',
				...(model.permit.car === 'carsharing'
					? [ carsharingHint ]
					: []),
			]`
		)
		KernAlert(
			v-if="limits.violated"
			type="danger"
			:dismissible="false"
			title="Grenzen werden überschritten"
			:items="violationItems"
		)
		TravelClaimItemsInput(
			v-model="model.items"
			:permit="model.permit"
			:kilometer-rate="rules.kilometerRate"
			:recipient-person="model.recipientPerson"
			:readonly="props.readonly || presets.readonly('items')"
			:attachment-url="props.processId && props.mutationId ? attachmentUrl : undefined"
		)
		dl.kern-description-list(v-if="advance > 0")
			.kern-description-list-item
				dt.kern-description-list-item__key Abzüglich Vorschuss
				dd.kern-description-list-item__value {{ formatCurrency(advance) }}
			.kern-description-list-item
				dt.kern-description-list-item__key {{ payout < 0 ? 'Zurückzuzahlen' : 'Auszuzahlen' }}
				dd.kern-description-list-item__value {{ formatCurrency(Math.abs(payout)) }}
	p.kern-body(v-else) Bitte wählen Sie zuerst die Dienstreisegenehmigung aus.
template(v-if="props.selectedItem === 'summary'")
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 1"
		title="Angaben zur Reise"
		:items=`[
			{ key: 'Genehmigung', value: model.permit ? model.permit.title : '–' },
			...(general
				? [
					{ key: 'Dienstgeschäft', value: model.title || '–' },
					{ key: 'Reiseziel', value: model.destination || '–' },
				]
				: [ { key: 'Reiseziel', value: model.permit?.destination ?? '–' } ]),
			{ key: 'Reisezeitraum', value: journeyPeriod },
			{ key: 'Erstattung an', value: travelerName(model.recipientPerson ?? '') },
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-claim-journey')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 2"
		title="Kosten"
		:items=`[
			...model.items.map((item) => ({
				key: travelerName(item.traveler ?? '') + ': ' + item.description,
				value: formatCurrency(item.amount),
			})),
			{ key: 'Summe', value: formatCurrency(limits.total) },
			...(advance > 0
				? [
					{ key: 'Abzüglich Vorschuss', value: formatCurrency(advance) },
					{ key: payout < 0 ? 'Zurückzuzahlen' : 'Auszuzahlen', value: formatCurrency(Math.abs(payout)) },
				]
				: []),
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-claim-items')"
	)
</template>
