<script setup lang="ts">
import type { TravelCostType } from '~/types'

import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | symbol | null>(null)

interface Model {
	ord: number | null
	costType: TravelCostType
	description: string | null
	amount: number
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

const valid = computed(() => !!model.value?.costType && model.value.amount > 0)

// Cloned through JSON, the nested entries of a line are reactive proxies that
// `structuredClone` refuses, even behind `toRaw`.
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
			costType: null,
			description: null,
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
	dialog.value.hide()
	emit('save', itemId.value, model.value)
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? 'Kostenzeile bearbeiten' : 'Kostenzeile hinzufügen'"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		TravelCostTypeInput(v-model="model.costType")
		KernCurrencyInput(
			v-model="model.amount"
			label="Höchstbetrag"
			hint="Mehr als dieser Betrag wird für diese Zeile nicht erstattet."
		)
		TravelTextInput(
			v-model="model.description"
			label="Erläuterung"
			:max-length="1024"
			multiline
			optional
		)
</template>
