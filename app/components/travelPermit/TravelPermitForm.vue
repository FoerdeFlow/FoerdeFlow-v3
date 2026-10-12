<script setup lang="ts">
import type { TravelPermitFormModel } from '~/types'

defineOptions({
	summaryItems: 5,
})

const props = defineProps<{
	selectedItem: string | null
	readonly?: boolean
	summaryOffset?: number
	/** The organization item whose budgets may be picked, if it is restricted. */
	organizationItem?: string | null
	meta?: unknown
	presets?: unknown
}>()

const presets = useProcessPresets(() => props.presets, () => props.readonly)

const emit = defineEmits<{
	select: [item: string]
}>()

const model = defineModel<TravelPermitFormModel>({
	required: true,
})

const general = computed(() => model.value.kind === 'general')

const limits = computed(() => travelPermitLimits(model.value, props.meta))

const kindOptions = computed(() => travelMeta(props.meta).permitKinds
	.map((value) => ({ value, label: formatTravelPermitKind(value) })))
const occasionOptions = travelPermitOccasionList
	.map((value) => ({ value, label: formatTravelPermitOccasion(value) }))
const travelerBasisOptions = travelPermitTravelerBasisList
	.map((value) => ({ value, label: formatTravelPermitTravelerBasis(value) }))
const specialInterestOptions = travelPermitSpecialInterestList
	.map((value) => ({ value, label: formatTravelPermitSpecialInterest(value) }))
const carOptions = travelPermitCarList
	.map((value) => ({ value, label: formatTravelPermitCar(value) }))

const limitBullets = computed(() => [
	...limits.value.rules.maximumAmountPerPerson === null
		? []
		: [ `Höchstens ${formatCurrency(limits.value.rules.maximumAmountPerPerson)} je Person` +
			(general.value ? ' und Reise' : '') ],
	...limits.value.rules.domesticOnly ? [ 'Nur Dienstreisen im Inland' ] : [],
])

const violationText = computed(() => [
	...limits.value.aboveLimit.length > 0
		? [ 'Die Kosten von ' + limits.value.aboveLimit
			.map((entry) => formatPerson(model.value.travelers[entry.index]?.person ?? null) || '?')
			.join(', ') +
			' übersteigen den Höchstbetrag von ' +
			`${formatCurrency(limits.value.rules.maximumAmountPerPerson)}.` ]
		: [],
	...limits.value.advanceInvalid
		? [ limits.value.advanceAllowed
			? `Der Vorschuss darf höchstens ${formatCurrency(limits.value.maximumAdvance)} betragen.`
			: 'Ein Vorschuss ist nur bei einer Einzelgenehmigung mit Kosten über ' +
				`${formatCurrency(limits.value.rules.advanceMinimumBase)} möglich.` ]
		: [],
	...limits.value.rules.domesticOnly && !model.value.domestic
		? [ 'Dienstreisen ins Ausland kann diese Stelle nicht genehmigen.' ]
		: [],
].join(' '))

const transportHints = [
	'Dienstreisen sind mit dem öffentlichen Personennahverkehr zu unternehmen. Für Fahrten im ' +
		'Geltungsbereich des Semestertickets werden keine Kosten erstattet.',
	'Fernverkehr ist nur erstattungsfähig, wenn die Fahrt im Regionalverkehr länger als zwei ' +
		'Stunden dauert und erheblich Zeit gespart wird; Sparpreise und private Vergünstigungen ' +
		'sind zu nutzen.',
	'Kraftfahrzeuge dürfen nur aus erheblichem dienstlichem Interesse genutzt werden; es sind ' +
		'Fahrgemeinschaften zu bilden.',
]

const advanceHint = computed(() => limits.value.advanceAllowed
	? `Höchstens ${formatCurrency(limits.value.maximumAdvance)} (§ 9).`
	: 'Ein Vorschuss ist erst bei Kosten über ' +
		`${formatCurrency(limits.value.rules.advanceMinimumBase)} möglich (§ 9).`)

const journeyPeriod = computed(() => model.value.startDate && model.value.endDate
	? formatBudgetPlan({ startDate: model.value.startDate, endDate: model.value.endDate })
	: '–')

const originItems = computed(() => model.value.type === 'planned'
	? [
		{ key: 'Herkunft der Mittel', value: 'Haushaltsplan' },
		{ key: 'Haushalt', value: formatBudget(model.value.budgetPlanItem?.plan?.budget ?? null) },
		{ key: 'Haushaltstitel', value: formatBudgetPlanItem(model.value.budgetPlanItem ?? null) },
	]
	: [
		{ key: 'Herkunft der Mittel', value: 'Rücklage' },
		{ key: 'Haushalt', value: formatBudget(model.value.budget ?? null) },
	])
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'travel-permit-journey'")
	TravelSelectInput(
		v-if="presets.visible('kind') && kindOptions.length > 1"
		v-model="model.kind"
		label="Art der Genehmigung"
		hint="Eine generelle Genehmigung deckt wiederkehrende Reisen mit Kosten bis 25 Euro je Reise (§ 3 Abs. 6)."
		:options="kindOptions"
		:readonly="presets.readonly('kind')"
	)
	TravelTextInput(
		v-if="presets.visible('title')"
		v-model="model.title"
		:label="general ? 'Zweck der Reisen' : 'Dienstgeschäft'"
		:readonly="presets.readonly('title')"
	)
	TravelTextInput(
		v-if="presets.visible('destination')"
		v-model="model.destination"
		:label="general ? 'Reiseziele' : 'Reiseziel'"
		:readonly="presets.readonly('destination')"
	)
	TravelCheckboxInput(
		v-if="presets.visible('domestic')"
		v-model="model.domestic"
		label="Die Dienstreise ist auf das Inland beschränkt"
		:readonly="presets.readonly('domestic')"
	)
	.kern-fieldset__body.kern-fieldset__body--horizontal
		TravelDateInput.flex-1(
			v-if="presets.visible('startDate')"
			v-model="model.startDate"
			:label="general ? 'Gültig ab' : 'Beginn der Reise'"
			:readonly="presets.readonly('startDate')"
		)
		TravelDateInput.flex-1(
			v-if="presets.visible('endDate')"
			v-model="model.endDate"
			:label="general ? 'Gültig bis' : 'Ende der Reise'"
			:readonly="presets.readonly('endDate')"
		)
	TravelSelectInput(
		v-if="presets.visible('occasion')"
		v-model="model.occasion"
		label="Anlass"
		:options="occasionOptions"
		:readonly="presets.readonly('occasion')"
	)
	TravelTextInput(
		v-if="presets.visible('description')"
		v-model="model.description"
		label="Beschreibung"
		multiline
		:max-length="1024"
		:readonly="presets.readonly('description')"
	)
template(v-if="props.selectedItem === 'travel-permit-source'")
	PaymentOrderTypeInput(
		v-if="presets.visible('type')"
		v-model="model.type"
		:readonly="presets.readonly('type')"
	)
	PaymentOrderBudgetPlanItemInput(
		v-if="model.type === 'planned' && presets.visible('budgetPlanItem')"
		v-model="model.budgetPlanItem"
		:organization-item="props.organizationItem"
		:readonly="presets.readonly('budgetPlanItem')"
	)
	PaymentOrderBudgetInput(
		v-if="model.type === 'reserve' && presets.visible('budget')"
		v-model="model.budget"
		:organization-item="props.organizationItem"
		:readonly="presets.readonly('budget')"
	)
template(v-if="props.selectedItem === 'travel-permit-basis'")
	TravelSelectInput(
		v-if="presets.visible('travelerBasis')"
		v-model="model.travelerBasis"
		label="Personenkreis"
		hint="Auf welcher Grundlage die Reisenden unter die Dienstreiserichtlinie fallen (§ 1)."
		:options="travelerBasisOptions"
		:readonly="presets.readonly('travelerBasis')"
	)
	TravelSelectInput(
		v-if="presets.visible('specialInterest')"
		v-model="model.specialInterest"
		label="Besonderes Interesse der Studierendenschaft"
		hint="Bei besonderem Interesse werden die Kosten über den Haushalt des AStA erstattet (§ 2 Abs. 2)."
		:options="specialInterestOptions"
		:readonly="presets.readonly('specialInterest')"
	)
	TravelTextInput(
		v-if="model.specialInterest === 'parliamentDecision' && presets.visible('specialInterestReference')"
		v-model="model.specialInterestReference"
		label="Beschluss des Studierendenparlaments"
		hint="Zum Beispiel Sitzung und Tagesordnungspunkt oder Drucksachennummer."
		:readonly="presets.readonly('specialInterestReference')"
	)
template(v-if="props.selectedItem === 'travel-permit-transport'")
	KernAlert(
		type="info"
		:dismissible="false"
		title="Verkehrsmittel (§ 6)"
		:items="transportHints"
	)
	TravelCheckboxInput(
		v-if="presets.visible('longDistance')"
		v-model="model.longDistance"
		label="Fernverkehr (Fernzug oder Fernbus) wird genutzt"
		:readonly="presets.readonly('longDistance')"
	)
	TravelSelectInput(
		v-if="presets.visible('car')"
		v-model="model.car"
		label="Kraftfahrzeug"
		:options="carOptions"
		:readonly="presets.readonly('car')"
	)
	template(v-if="model.car !== 'none'")
		TravelTextInput(
			v-if="presets.visible('carInterestReason')"
			v-model="model.carInterestReason"
			label="Erhebliches dienstliches Interesse"
			hint="Zum Beispiel Zeitersparnis je Strecke, Fahrgemeinschaft, Transport der Wahlurnen oder von Lasten (§ 6 Abs. 4)."
			multiline
			:max-length="1024"
			:readonly="presets.readonly('carInterestReason')"
		)
		TravelCheckboxInput(
			v-if="presets.visible('parkingFeesAllowed')"
			v-model="model.parkingFeesAllowed"
			label="Parkgebühren werden erstattet"
			:readonly="presets.readonly('parkingFeesAllowed')"
		)
	template(v-if="model.car === 'carsharing'")
		KernAlert(
			type="info"
			:dismissible="false"
			title="Dienstliche Fahrzeuge (§ 7)"
			:items=`[
				'Eine private Nutzung ist ausgeschlossen.',
				'Bei gleicher Eignung sind E-Autos vorrangig zu nutzen.',
				'Die Richtgeschwindigkeit auf Autobahnen von 130 km/h darf nicht überschritten werden.',
			]`
		)
		KernCurrencyInput(
			v-if="presets.visible('carsharingEstimate')"
			v-model="model.carsharingEstimate"
			label="Geschätzte Carsharing-Kosten"
			hint="Werden per Sammelrechnung beglichen und nicht erstattet, zählen aber für die Höchstbeträge."
			:readonly="presets.readonly('carsharingEstimate')"
		)
template(v-if="props.selectedItem === 'travel-permit-travelers'")
	KernAlert(
		v-if="limits.violated || (limits.rules.domesticOnly && !model.domestic)"
		type="danger"
		:dismissible="false"
		title="Grenzen werden nicht eingehalten"
		:text="violationText"
	)
	KernAlert(
		v-else-if="limitBullets.length > 0"
		type="info"
		:dismissible="false"
		title="Grenzen dieser Genehmigungsstelle"
		:items="limitBullets"
	)
	TravelPermitTravelersInput(
		v-if="presets.visible('travelers')"
		v-model="model.travelers"
		:carsharing="model.car === 'carsharing'"
		:share="limits.share"
		:readonly="presets.readonly('travelers')"
	)
	KernCurrencyInput(
		v-if="!general && presets.visible('advanceAmount')"
		v-model="model.advanceAmount"
		label="Vorschuss (optional)"
		:hint="advanceHint"
		:readonly="presets.readonly('advanceAmount')"
	)
template(v-if="props.selectedItem === 'summary'")
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 1"
		title="Angaben zur Dienstreise"
		:items=`[
			{ key: 'Art der Genehmigung', value: formatTravelPermitKind(model.kind) },
			{ key: general ? 'Zweck der Reisen' : 'Dienstgeschäft', value: model.title || '–' },
			{ key: 'Reiseziel', value: (model.destination || '–') + (model.domestic ? '' : ' (Ausland)') },
			{ key: general ? 'Gültigkeitszeitraum' : 'Reisezeitraum', value: journeyPeriod },
			{ key: 'Anlass', value: formatTravelPermitOccasion(model.occasion) },
			{ key: 'Beschreibung', value: model.description || '–' },
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-permit-journey')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 2"
		title="Haushalt"
		:items="originItems"
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-permit-source')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 3"
		title="Personenkreis und Interesse"
		:items=`[
			{ key: 'Personenkreis', value: formatTravelPermitTravelerBasis(model.travelerBasis) },
			{
				key: 'Besonderes Interesse',
				value: formatTravelPermitSpecialInterest(model.specialInterest) +
					(model.specialInterest === 'parliamentDecision' && model.specialInterestReference
						? ' (' + model.specialInterestReference + ')'
						: ''),
			},
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-permit-basis')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 4"
		title="Verkehrsmittel"
		:items=`[
			{ key: 'Fernverkehr', value: model.longDistance ? 'Ja' : 'Nein' },
			{ key: 'Kraftfahrzeug', value: formatTravelPermitCar(model.car) },
			...(model.car === 'none'
				? []
				: [
					{ key: 'Dienstliches Interesse', value: model.carInterestReason || '–' },
					{ key: 'Parkgebühren', value: model.parkingFeesAllowed ? 'werden erstattet' : 'werden nicht erstattet' },
				]),
			...(model.car === 'carsharing'
				? [ { key: 'Geschätzte Carsharing-Kosten', value: formatCurrency(model.carsharingEstimate ?? 0) } ]
				: []),
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-permit-transport')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 5"
		title="Reisende und Kosten"
		:items=`[
			{ key: 'Erstattungsfähige Kosten', value: formatCurrency(limits.reimbursable) },
			...(model.travelers.length === 0
				? [ { key: 'Reisende', value: '–' } ]
				: model.travelers.map((traveler) => ({
					key: 'davon: ' + (formatPerson(traveler.person) || '–') + (traveler.driver ? ' (fahrend)' : ''),
					value: formatCurrency(traveler.amount),
				}))),
			...(general ? [] : [ { key: 'Vorschuss', value: model.advanceAmount ? formatCurrency(model.advanceAmount) : '–' } ]),
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-permit-travelers')"
	)
</template>
