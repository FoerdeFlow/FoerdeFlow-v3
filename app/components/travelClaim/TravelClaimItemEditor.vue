<script setup lang="ts">
import type { TravelClaimItemCategory } from '#shared/utils/travel'
import type { TravelClaimItemInput, TravelClaimPermit } from '~/types'

import { KernDialog } from '#components'

const props = defineProps<{
	permit: TravelClaimPermit
	kilometerRate: number
	/** The ordinals of the other items, not to be repeated. */
	usedOrds?: number[]
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | symbol | null>(null)

type Model = Omit<TravelClaimItemInput, 'id' | 'receipts'>

const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
// The files cannot be cloned through JSON like the rest of the item, so they
// are kept apart and only handed over on saving.
const receipts = ref<File[]>([])
const receiptsChanged = ref(false)

const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return receiptsChanged.value || JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

const categoryOptions = computed(() => travelClaimItemCategoryList
	.filter((category) => travelClaimCategoryAllowed(category, props.permit))
	.map((value) => ({ value, label: formatTravelClaimItemCategory(value) })))

const travelerOptions = computed(() => props.permit.travelers
	.filter((traveler) => traveler.person?.id)
	.map((traveler) => ({ value: traveler.person?.id ?? '', label: formatPerson(traveler.person) })))

const privateCar = computed(() => model.value?.category === 'privateCar')
const eventCategory = computed(() =>
	!!model.value && travelClaimEventCategories.includes(model.value.category))

const kilometerAmount = computed(() => model.value?.kilometers
	? travelKilometerAmount(model.value.kilometers, props.kilometerRate)
	: 0)

const valid = computed(() => {
	if(!model.value) return false
	const ord = model.value.ord
	return typeof ord === 'number' && Number.isInteger(ord) && ord >= 1 &&
		!props.usedOrds?.includes(ord) &&
		!!model.value.traveler &&
		model.value.description.trim() !== '' &&
		(privateCar.value
			? (model.value.kilometers ?? 0) > 0
			: model.value.amount > 0 && receipts.value.length > 0) &&
		(!eventCategory.value || !!model.value.event?.trim())
})

function clone(data: Model): Model {
	return JSON.parse(JSON.stringify(data)) as Model
}

function openDialog(id: string | symbol | null, data: Model, files: File[]) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = clone(data)
	model.value = clone(data)
	receipts.value = [ ...files ]
	receiptsChanged.value = false
	dialog.value.show()
}

defineExpose({
	create(ord: number, traveler: string | null) {
		const category: TravelClaimItemCategory = 'publicTransport'
		openDialog(null, {
			ord,
			traveler,
			category,
			description: '',
			amount: 0,
			kilometers: null,
			event: null,
		}, [])
	},
	edit({ id, receipts: files, ...item }: TravelClaimItemInput) {
		openDialog(id, item, Array.isArray(files)
			? files.filter((file) => file instanceof File)
			: [])
	},
})

const emit = defineEmits<{
	save: [string | symbol | null, TravelClaimItemInput]
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

function save() {
	if(!dialog.value || !model.value) return
	dialog.value.hide()
	const item = model.value
	emit('save', itemId.value, {
		...item,
		id: itemId.value,
		amount: privateCar.value ? kilometerAmount.value : item.amount,
		kilometers: privateCar.value ? item.kilometers : null,
		event: eventCategory.value ? item.event?.trim() ?? null : null,
		receipts: privateCar.value ? [] : receipts.value,
	})
}

function addReceipts(event: Event) {
	const input = event.target as HTMLInputElement
	receipts.value = [ ...receipts.value, ...Array.from(input.files ?? []) ]
	receiptsChanged.value = true
	input.value = ''
}

function removeReceipt(index: number) {
	receipts.value = receipts.value.filter((_, position) => position !== index)
	receiptsChanged.value = true
}

const ordId = useId()
const kilometersId = useId()
const receiptsId = useId()
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? 'Position bearbeiten' : 'Position hinzufügen'"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		.kern-form-input
			label.kern-label(:for="ordId") Ordnungsnummer
			input.kern-form-input__input(
				:id="ordId"
				v-model.number="model.ord"
				type="number"
				min="1"
				step="1"
			)
		TravelSelectInput(
			:model-value="model.traveler ?? ''"
			label="Reisende Person"
			:options="travelerOptions"
			@update:model-value="model.traveler = $event || null"
		)
		TravelSelectInput(
			v-model="model.category"
			label="Kostenart"
			hint="Angeboten werden nur die Kostenarten, welche die Genehmigung abdeckt."
			:options="categoryOptions"
		)
		TravelTextInput(
			:model-value="model.description"
			:label="privateCar ? 'Strecke' : 'Bezeichnung'"
			:hint="privateCar ? 'Start und Ziel der Fahrt, z. B. Kiel – Lübeck und zurück.' : undefined"
			@update:model-value="model.description = $event ?? ''"
		)
		TravelTextInput(
			v-if="eventCategory"
			v-model="model.event"
			label="Veranstaltung"
			hint="Tagungsgelder und Fortbildungskosten werden mit höchstens 100 Euro je Person und Veranstaltung erstattet (§ 8)."
		)
		template(v-if="privateCar")
			.kern-form-input
				label.kern-label(:for="kilometersId") Wegstrecke in Kilometern
				.kern-hint(:id="`${kilometersId}-hint`")
					| Erstattet werden {{ formatCurrency(props.kilometerRate) }} je Kilometer (§ 6 Abs. 3),
					| hier {{ formatCurrency(kilometerAmount) }}.
				input.kern-form-input__input(
					:id="kilometersId"
					v-model.number="model.kilometers"
					type="number"
					min="1"
					step="1"
					:aria-describedby="`${kilometersId}-hint`"
				)
		template(v-else)
			KernCurrencyInput(
				v-model="model.amount"
				label="Betrag laut Beleg"
			)
			.kern-form-input
				label.kern-label(:for="receiptsId") Belege
				.kern-hint(:id="`${receiptsId}-hint`")
					| Erstattet werden nur Kosten, die mit Belegen nachgewiesen sind (§ 5 Abs. 2). PDF oder Bild.
				input.kern-form-input__input(
					:id="receiptsId"
					type="file"
					multiple
					accept="application/pdf,image/jpeg,image/png,image/webp"
					:aria-describedby="`${receiptsId}-hint`"
					@change="addReceipts"
				)
			ul.kern-list(v-if="receipts.length > 0")
				li(
					v-for="(file, index) of receipts"
					:key="`${file.name}-${index}`"
				)
					| {{ file.name }} ({{ (file.size / 1024).toFixed(0) }} KB)
					button.kern-btn.kern-btn--tertiary(
						type="button"
						@click="removeReceipt(index)"
					)
						span.kern-icon.kern-icon--delete(aria-hidden="true")
						span.kern-sr-only Beleg entfernen
</template>
