<script setup lang="ts">
import type { TravelClaimItemEditor } from '#components'
import type { TravelClaimItemInput, TravelPermitSummary } from '~/types'

interface Model {
	ord: number | null
	permitItem: string | null
	description: string | null
	amount: number
}

const props = defineProps<{
	permit: TravelPermitSummary
	readonly?: boolean
}>()

const editor = useTemplateRef<typeof TravelClaimItemEditor>('editor')

const model = defineModel<TravelClaimItemInput[]>({
	required: true,
})

const amounts = computed(() => travelClaimAmounts(props.permit.items, model.value))

const advance = computed(() => props.permit.advance?.amount ?? 0)
const payout = computed(() => currencySum(amounts.value.amount, -advance.value))

const permitItemLabel = (permitItem: string | null) => {
	const item = props.permit.items.find((entry) => entry.id === permitItem)
	return item
		? formatTravelCoded(item.costType) + (item.description ? `: ${item.description}` : '')
		: '–'
}

// The lines keep the order they were entered in, see the permit.
const nextOrd = computed(() => Math.max(0, ...model.value.map((item) => item.ord ?? 0)) + 10)

function create() {
	editor.value?.create(nextOrd.value)
}

function edit(item: TravelClaimItemInput) {
	editor.value?.edit(item)
}

function remove(item: TravelClaimItemInput) {
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
</script>

<template lang="pug">
KernTable(
	caption="Tatsächliche Kosten"
	:create-permission="props.readonly ? null : true"
	:update-permission="props.readonly ? null : true"
	:delete-permission="props.readonly ? null : true"
	:columns=`[
		{
			name: 'permitItem',
		},
		{
			name: 'amount',
			width: '10em',
			class: 'numeric',
		},
	]`
	:data="model"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#permitItem-header)
		| Geplante Kosten
	template(#permitItem-body="{ item }")
		span.kern-body {{ permitItemLabel(item.permitItem) }}
		template(v-if="item.description")
			br
			span.kern-body.kern-body--small {{ item.description }}
	template(#amount-header)
		| Betrag
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.amount, 'amount') }}
KernTable.mt-8(
	caption="Erstattung je geplanter Zeile"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	:columns=`[
		{
			name: 'permitItem',
		},
		{
			name: 'maximumAmount',
			width: '9em',
			class: 'numeric',
		},
		{
			name: 'requestedAmount',
			width: '9em',
			class: 'numeric',
		},
		{
			name: 'amount',
			width: '9em',
			class: 'numeric',
		},
	]`
	:data="amounts.lines"
	show-footer
)
	template(#permitItem-header)
		| Geplante Kosten
	template(#permitItem-body="{ item }")
		| {{ permitItemLabel(item.permitItem) }}
	template(#permitItem-footer)
		| Summe
	template(#maximumAmount-header)
		| Genehmigt
	template(#maximumAmount-body="{ item }")
		| {{ formatCurrency(item.maximumAmount, 'amount') }}
	template(#maximumAmount-footer)
		| {{ formatCurrency(props.permit.amount, 'amount') }}
	template(#requestedAmount-header)
		| Tatsächlich
	template(#requestedAmount-body="{ item }")
		| {{ formatCurrency(item.requestedAmount, 'amount') }}
	template(#requestedAmount-footer)
		| {{ formatCurrency(amounts.requestedAmount, 'amount') }}
	template(#amount-header)
		| Erstattet
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.amount, 'amount') }}
	template(#amount-footer)
		| {{ formatCurrency(amounts.amount, 'amount') }}
dl.kern-description-list.mt-4
	.kern-description-list-item(v-if="advance > 0")
		dt.kern-description-list-item__key Bereits gezahlter Vorschuss
		dd.kern-description-list-item__value {{ formatCurrency(advance, 'amount') }}
	.kern-description-list-item
		dt.kern-description-list-item__key {{ payout < 0 ? 'Zurückzuzahlen' : 'Auszuzahlen' }}
		dd.kern-description-list-item__value {{ formatCurrency(Math.abs(payout), 'amount') }}
TravelClaimItemEditor(
	ref="editor"
	:permit-items="props.permit.items"
	@save="save"
)
</template>
