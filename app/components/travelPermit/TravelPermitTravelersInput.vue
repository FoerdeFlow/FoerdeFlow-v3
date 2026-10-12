<script setup lang="ts">
import type { TravelPermitTravelerEditor } from '#components'
import type { TravelPermitTravelerInput } from '~/types'

interface Model {
	ord: number | null
	person: TravelPermitTravelerInput['person']
	amount: number
	driver: boolean
}

const props = defineProps<{
	carsharing: boolean
	/** The share of the car sharing each traveller is charged with. */
	share: number
	readonly?: boolean
}>()

const editor = useTemplateRef<typeof TravelPermitTravelerEditor>('editor')

const model = defineModel<TravelPermitTravelerInput[]>({
	required: true,
})

const total = computed(() => currencySum(...model.value.map((item) => item.amount)))

// Which traveller the editor is working on, so that its own ordinal does not
// count as taken. `undefined` means that a new traveller is being added.
const editing = ref<string | symbol | null | undefined>()

const usedOrds = computed(() => model.value
	.filter((traveler) => traveler.id !== editing.value)
	.map((traveler) => traveler.ord)
	.filter((ord) => ord !== null))

const nextOrd = computed(() => Math.floor(Math.max(0, ...usedOrds.value) / 10) * 10 + 10)

function create() {
	if(!editor.value) return
	editing.value = undefined
	editor.value.create(nextOrd.value)
}

function edit(item: TravelPermitTravelerInput) {
	if(!editor.value) return
	editing.value = item.id
	editor.value.edit(item)
}

function remove(item: TravelPermitTravelerInput) {
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
		model.value.push({ id: Symbol('newTraveler'), ...item })
	}
}
</script>

<template lang="pug">
KernTable.w-full(
	caption="Reisende und voraussichtliche Kosten"
	:create-permission="props.readonly ? null : true"
	:update-permission="props.readonly ? null : true"
	:delete-permission="props.readonly ? null : true"
	:columns=`[
		{
			name: 'person',
		},
		{
			name: 'amount',
			width: '14em',
			class: 'numeric',
		},
	]`
	:data="model ?? []"
	show-footer
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#person-header)
		| Person
	template(#person-body="{ item }")
		template(v-if="item.ord !== null")
			span.kern-body--small
				| ({{ item.ord }})
			| &nbsp;
		span.kern-body {{ formatPerson(item.person) }}
		span.kern-body--small(v-if="props.carsharing && item.driver")
			| &nbsp;(fahrend)
	template(#amount-header)
		| Kosten
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.amount) }}
	template(#person-footer)
		| Summe der erstattungsfähigen Kosten
	template(#amount-footer)
		| {{ formatCurrency(total) }}
p.kern-body.kern-body--small(v-if="props.carsharing && props.share > 0")
	| Zu jeder Person kommt für die Höchstbeträge ein Anteil von {{ formatCurrency(props.share) }} an den Carsharing-Kosten hinzu.
TravelPermitTravelerEditor(
	ref="editor"
	:carsharing="props.carsharing"
	:used-ords="usedOrds"
	@save="save"
)
</template>
