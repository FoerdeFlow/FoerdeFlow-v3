<script setup lang="ts">
import type { Person } from '~/types'

import { KernDialog } from '#components'

const props = defineProps<{
	/** Whether a car of the student body is used, which asks who drives. */
	carsharing: boolean
	/** The ordinals of the other travellers, not to be repeated. */
	usedOrds?: number[]
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | symbol | null>(null)

interface Model {
	ord: number | null
	person: Person
	amount: number
	driver: boolean
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

const valid = computed(() => {
	const ord = model.value?.ord
	return typeof ord === 'number' && Number.isInteger(ord) && ord >= 1 &&
		!props.usedOrds?.includes(ord) &&
		(model.value?.amount ?? -1) >= 0
})

function clone(data: Model): Model {
	return JSON.parse(JSON.stringify(data)) as Model
}

function openDialog(id: string | symbol | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = clone(data)
	model.value = clone(data)
	dialog.value.show()
}

defineExpose({
	create(ord: number) {
		openDialog(null, {
			ord,
			person: null,
			amount: 0,
			driver: false,
		})
	},
	edit({ id, ...item }: { id: string | symbol | null } & Model) {
		openDialog(id, item)
	},
})

const emit = defineEmits<{
	save: [string | symbol | null, Model]
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

function save() {
	if(!dialog.value || !model.value) return
	if(!model.value.person) {
		dialog.value.showAlert({
			type: 'danger',
			title: 'Keine Person ausgewählt',
			text: 'Bitte wählen Sie die reisende Person aus.',
		})
		return
	}
	dialog.value.hide()
	emit('save', itemId.value, {
		...model.value,
		driver: props.carsharing && model.value.driver,
	})
}

const personId = useId()
const ordId = useId()
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? 'Reisende Person bearbeiten' : 'Reisende Person hinzufügen'"
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
		.kern-form-input
			label.kern-label(:for="personId") Reisende Person
			PersonSelect(
				:id="personId"
				v-model="model.person"
			)
		KernCurrencyInput(
			v-model="model.amount"
			label="Voraussichtliche erstattungsfähige Kosten"
			hint="Fahrtkosten, Tagungsgelder und Fortbildungskosten dieser Person (§ 5). Bei einer generellen Genehmigung: je Reise."
		)
		TravelCheckboxInput(
			v-if="props.carsharing"
			v-model="model.driver"
			label="Diese Person fährt ein dienstliches Fahrzeug"
			hint="Fahren dürfen nur Personen mit erfasster Fahrberechtigung (§ 7 Abs. 2)."
		)
</template>
