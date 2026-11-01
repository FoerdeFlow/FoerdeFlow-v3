<script setup lang="ts">
import type { TravelPermitFormModel } from '~/types'

defineOptions({
	summaryItems: 5,
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

const model = defineModel<TravelPermitFormModel>({
	required: true,
})

const rules = computed(() => travelPermitMeta(props.meta))

const startDate = computed(() => model.value.startDate instanceof Date
	? serializeDate(model.value.startDate)
	: model.value.startDate)

const budget = computed(() => model.value.budgetPlanItem?.plan.budget ??
	model.value.specialAllocation?.budget ?? model.value.role?.budget ?? null)

const total = computed(() => currencySum(...model.value.items.map((item) => item.amount)))

const period = computed(() => model.value.startDate && model.value.endDate
	? `${formatDate(model.value.startDate)} bis ${formatDate(model.value.endDate)}`
	: '–')
</script>

<template lang="pug">
template(v-if="props.selectedItem === 'travel-permit-traveler'")
	.kern-form-input(v-if="presets.visible('traveler')")
		label.kern-label(for="travel-permit-traveler") Reisende*r
		PersonSelect(
			id="travel-permit-traveler"
			v-model="model.traveler"
			:readonly="presets.readonly('traveler')"
		)
	TravelRoleInput(
		v-if="presets.visible('role')"
		v-model="model.role"
		:allowed-codes="rules.roles"
		:readonly="presets.readonly('role')"
	)
	TravelSpecialAllocationInput(
		v-if="presets.visible('specialAllocation')"
		v-model="model.specialAllocation"
		:allowed-codes="rules.specialAllocations"
		:readonly="presets.readonly('specialAllocation')"
	)
template(v-if="props.selectedItem === 'travel-permit-journey'")
	TravelTextInput(
		v-if="presets.visible('title')"
		v-model="model.title"
		label="Titel"
		hint="Zum Beispiel der Anlass der Reise."
		:readonly="presets.readonly('title')"
	)
	TravelTextInput(
		v-if="presets.visible('description')"
		v-model="model.description"
		label="Erläuterung"
		:max-length="1024"
		multiline
		optional
		:readonly="presets.readonly('description')"
	)
	TravelTextInput(
		v-if="presets.visible('origin')"
		v-model="model.origin"
		label="Abfahrtsort"
		:readonly="presets.readonly('origin')"
	)
	TravelTextInput(
		v-if="presets.visible('destination')"
		v-model="model.destination"
		label="Zielort"
		:readonly="presets.readonly('destination')"
	)
	TravelDateInput(
		v-if="presets.visible('startDate')"
		v-model="model.startDate"
		label="Reisebeginn"
		:readonly="presets.readonly('startDate')"
	)
	TravelDateInput(
		v-if="presets.visible('endDate')"
		v-model="model.endDate"
		label="Reiseende"
		:readonly="presets.readonly('endDate')"
	)
template(v-if="props.selectedItem === 'travel-permit-transport'")
	TravelTransportModeInput(
		v-if="presets.visible('transportMode')"
		v-model="model.transportMode"
		:readonly="presets.readonly('transportMode')"
	)
	TravelTransportReasonInput(
		v-if="presets.visible('transportReason') && model.transportMode?.reasonRequired"
		v-model="model.transportReason"
		:transport-mode="model.transportMode?.id ?? null"
		:role="model.role?.id ?? null"
		:readonly="presets.readonly('transportReason')"
	)
template(v-if="props.selectedItem === 'travel-permit-budget'")
	.kern-form-input(v-if="presets.visible('type')")
		label.kern-label(for="travel-permit-type") Herkunft der Mittel
		PaymentOrderTypeSelect(
			id="travel-permit-type"
			v-model="model.type"
			:readonly="presets.readonly('type')"
		)
	TravelPermitBudgetPlanItemInput(
		v-if="model.type === 'planned' && presets.visible('budgetPlanItem')"
		v-model="model.budgetPlanItem"
		:role="model.role?.id ?? null"
		:special-allocation="model.specialAllocation?.id ?? null"
		:start-date="startDate"
		:readonly="presets.readonly('budgetPlanItem')"
	)
	p.kern-body(v-else-if="model.type === 'reserve'")
		| Die Reise wird aus der Rücklage des Haushalts {{ formatBudget(budget) || '–' }} bezahlt.
template(v-if="props.selectedItem === 'travel-permit-items'")
	TravelPermitItemsInput(
		v-model="model.items"
		:meta="props.meta"
		:readonly="presets.readonly('items')"
	)
template(v-if="props.selectedItem === 'summary'")
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 1"
		title="Reisende*r und Rolle"
		:items=`[
			{ key: 'Reisende*r', value: formatPerson(model.traveler) || '–' },
			{ key: 'Rolle', value: formatTravelCoded(model.role) },
			{ key: 'Haushaltssonderzuweisung', value: formatTravelCoded(model.specialAllocation) },
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-permit-traveler')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 2"
		title="Dienstreise"
		:items=`[
			{ key: 'Titel', value: model.title || '–' },
			{ key: 'Erläuterung', value: model.description || '–' },
			{ key: 'Reise', value: (model.origin || '–') + ' – ' + (model.destination || '–') },
			{ key: 'Zeitraum', value: period },
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-permit-journey')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 3"
		title="Verkehrsmittel"
		:items=`[
			{ key: 'Verkehrsmittel', value: formatTravelCoded(model.transportMode) },
			...(model.transportReason
				? [ { key: 'Grund', value: formatTravelCoded(model.transportReason) } ]
				: []),
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-permit-transport')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 4"
		title="Haushalt"
		:items=`[
			{ key: 'Haushalt', value: formatBudget(budget) || '–' },
			model.type === 'planned'
				? { key: 'Haushaltstitel', value: model.budgetPlanItem ? formatBudgetPlanItem(model.budgetPlanItem) : '–' }
				: { key: 'Herkunft der Mittel', value: 'Rücklage' },
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-permit-budget')"
	)
	KernSummary(
		:number="(props.summaryOffset ?? 0) + 5"
		title="Voraussichtliche Kosten"
		:items=`[
			...model.items.map((item) => ({
				key: formatTravelCoded(item.costType) + (item.description ? ': ' + item.description : ''),
				value: formatCurrency(item.amount, 'amount'),
			})),
			{ key: 'Summe', value: formatCurrency(total, 'amount') },
		]`
		:readonly="props.readonly"
		@click.prevent="emit('select', 'travel-permit-items')"
	)
</template>
