<script setup lang="ts">
import type { Person, RepresentationAllowancePeriodUnit } from '~/types'

import { KernDialog } from '#components'

const props = defineProps<{
	periodUnit: RepresentationAllowancePeriodUnit
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | symbol | null>(null)

interface Model {
	ord: number | null
	person: Person
	amount: number
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
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
	create() {
		openDialog(null, {
			ord: null,
			person: null,
			amount: 0,
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
			text: 'Bitte wählen Sie eine Person aus.',
		})
		return
	}
	dialog.value.hide()
	emit('save', itemId.value, model.value)
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('representationAllowanceRecipient.edit.title') : $t('representationAllowanceRecipient.create.title')"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		RepresentationAllowanceRecipientOrdInput(
			v-model="model.ord"
		)
		RepresentationAllowanceRecipientPersonInput(
			v-model="model.person"
		)
		RepresentationAllowanceRecipientAmountInput(
			v-model="model.amount"
			:period-unit="props.periodUnit"
		)
</template>
