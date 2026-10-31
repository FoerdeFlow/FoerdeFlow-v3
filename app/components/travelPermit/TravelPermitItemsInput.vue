<script setup lang="ts">
import type { TravelPermitItemEditor } from '#components'
import type { TravelPermitViolation } from '#shared/utils/travel'
import type { TravelCostType, TravelPermitItemInput } from '~/types'

interface Model {
	ord: number | null
	costType: TravelCostType
	description: string | null
	amount: number
}

const props = defineProps<{
	meta?: unknown
	readonly?: boolean
}>()

const editor = useTemplateRef<typeof TravelPermitItemEditor>('editor')

const model = defineModel<TravelPermitItemInput[]>({
	required: true,
})

const total = computed(() => currencySum(...model.value.map((item) => item.amount)))

const violations = computed(() => travelPermitViolations(
	model.value.map((item) => ({ costType: item.costType?.code ?? null, amount: item.amount })),
	props.meta,
))

// Ordinals are handed out in steps of ten, as for the other breakdowns, but
// they are never shown: the lines keep the order they were entered in.
const nextOrd = computed(() => Math.max(0, ...model.value.map((item) => item.ord ?? 0)) + 10)

function create() {
	editor.value?.create(nextOrd.value)
}

function edit(item: TravelPermitItemInput) {
	editor.value?.edit(item)
}

function remove(item: TravelPermitItemInput) {
	const index = model.value.findIndex((entry) => entry === item)
	if(index === -1) return
	model.value.splice(index, 1)
}

function save(id: string | symbol | null, item: Model) {
	if(id) {
		const index = model.value.findIndex((entry) => entry.id === id)
		if(index === -1) return
		model.value[index] = { id, ...item }
	} else {
		model.value.push({ id: Symbol('newItem'), ...item })
	}
}

function describeViolation(violation: TravelPermitViolation) {
	const scope = violation.costTypes
		? `für ${violation.costTypes.join(', ')}`
		: 'für die gesamte Dienstreise'
	return `Der Höchstbetrag ${scope} liegt bei ${formatCurrency(violation.maximumAmount, 'amount')}, ` +
		`die Kostenaufstellung kommt auf ${formatCurrency(violation.amount, 'amount')}.`
}

const violationTexts = computed(() => violations.value.map(describeViolation))
</script>

<template lang="pug">
KernTable(
	caption="Voraussichtliche Kosten"
	:create-permission="props.readonly ? null : true"
	:update-permission="props.readonly ? null : true"
	:delete-permission="props.readonly ? null : true"
	:columns=`[
		{
			name: 'costType',
		},
		{
			name: 'amount',
			width: '10em',
			class: 'numeric',
		},
	]`
	:data="model"
	show-footer
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#costType-header)
		| Kostenart
	template(#costType-body="{ item }")
		span.kern-body {{ formatTravelCoded(item.costType) }}
		template(v-if="item.description")
			br
			span.kern-body.kern-body--small {{ item.description }}
	template(#costType-footer)
		| Summe
	template(#amount-header)
		| Höchstbetrag
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.amount, 'amount') }}
	template(#amount-footer)
		| {{ formatCurrency(total, 'amount') }}
KernAlert(
	v-if="!props.readonly && violations.length > 0"
	type="danger"
	title="Höchstbetrag überschritten"
	:items="violationTexts"
	:dismissible="false"
)
TravelPermitItemEditor(
	ref="editor"
	@save="save"
)
</template>
