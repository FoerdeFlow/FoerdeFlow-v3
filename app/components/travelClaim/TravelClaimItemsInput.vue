<script setup lang="ts">
import type { TravelClaimItemEditor } from '#components'
import type { TravelClaimItemInput, TravelClaimPermit } from '~/types'

const props = defineProps<{
	permit: TravelClaimPermit
	kilometerRate: number
	/** The person the claim is made for, offered first for a new item. */
	recipientPerson: string | null
	readonly?: boolean
	/** Where the receipts of a claim that was sent can be loaded from. */
	attachmentUrl?: (name: string) => string
}>()

const editor = useTemplateRef<typeof TravelClaimItemEditor>('editor')

const model = defineModel<TravelClaimItemInput[]>({
	required: true,
})

const total = computed(() => currencySum(...model.value.map((item) => item.amount)))

const travelerNames = computed(() => Object.fromEntries(props.permit.travelers
	.filter((traveler) => traveler.person?.id)
	.map((traveler) => [ traveler.person?.id ?? '', formatPerson(traveler.person) ])))

const editing = ref<string | symbol | null | undefined>()

const usedOrds = computed(() => model.value
	.filter((item) => item.id !== editing.value)
	.map((item) => item.ord)
	.filter((ord) => ord !== null))

const nextOrd = computed(() => Math.floor(Math.max(0, ...usedOrds.value) / 10) * 10 + 10)

function create() {
	if(!editor.value) return
	editing.value = undefined
	editor.value.create(nextOrd.value, props.recipientPerson)
}

function edit(item: TravelClaimItemInput) {
	if(!editor.value) return
	editing.value = item.id
	editor.value.edit(item)
}

function remove(item: TravelClaimItemInput) {
	const index = model.value.findIndex((entry) => entry === item)
	if(index === -1) return
	model.value.splice(index, 1)
}

function save(id: string | symbol | null, item: TravelClaimItemInput) {
	if(id) {
		const index = model.value.findIndex((entry) => entry.id === id)
		if(index === -1) return
		model.value[index] = item
	} else {
		model.value.push({ ...item, id: Symbol('newClaimItem') })
	}
}

/**
 * Lists the receipts of an item, either the files that were picked or, once
 * the claim was sent, the attachments they were stored as.
 */
function receiptLinks(item: TravelClaimItemInput) {
	if(typeof item.receipts === 'number') {
		return Array.from({ length: item.receipts }, (_, index) => ({
			label: `Beleg ${index + 1}`,
			url: item.ord !== null && props.attachmentUrl
				? props.attachmentUrl(`receipt_${item.ord}_${index}`)
				: null,
		}))
	}
	return item.receipts
		.filter((file) => file instanceof File)
		.map((file) => ({ label: file.name, url: null }))
}
</script>

<template lang="pug">
KernTable.w-full(
	caption="Positionen der Abrechnung"
	:create-permission="props.readonly ? null : true"
	:update-permission="props.readonly ? null : true"
	:delete-permission="props.readonly ? null : true"
	:columns=`[
		{
			name: 'description',
		},
		{
			name: 'receipts',
			width: '12em',
		},
		{
			name: 'amount',
			width: '10em',
			class: 'numeric',
		},
	]`
	:data="model ?? []"
	show-footer
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#description-header)
		| Position
	template(#description-body="{ item }")
		template(v-if="item.ord !== null")
			span.kern-body--small
				| ({{ item.ord }})
			| &nbsp;
		span.kern-body {{ item.description }}
		br
		span.kern-body--small
			| {{ travelerNames[item.traveler ?? ''] ?? '?' }} · {{ formatTravelClaimItemCategory(item.category) }}
			template(v-if="item.kilometers")
				|  · {{ item.kilometers }} km
			template(v-if="item.event")
				|  · {{ item.event }}
	template(#receipts-header)
		| Belege
	template(#receipts-body="{ item }")
		template(v-if="item.category === 'privateCar'")
			| –
		ul.kern-list(v-else)
			li(
				v-for="receipt of receiptLinks(item)"
				:key="receipt.label"
			)
				a.kern-link(
					v-if="receipt.url"
					:href="receipt.url"
					target="_blank"
				) {{ receipt.label }}
				template(v-else) {{ receipt.label }}
	template(#amount-header)
		| Betrag
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.amount) }}
	template(#description-footer)
		| Summe
	template(#amount-footer)
		| {{ formatCurrency(total) }}
TravelClaimItemEditor(
	ref="editor"
	:permit="props.permit"
	:kilometer-rate="props.kilometerRate"
	:used-ords="usedOrds"
	@save="save"
)
</template>
