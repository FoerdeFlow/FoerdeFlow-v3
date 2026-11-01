<script setup lang="ts">
import type { TravelPermitSummary } from '~/types'

import { KernDialog } from '#components'

const props = defineProps<{
	/** The lines of the permit a cost may be booked on. */
	permitItems: TravelPermitSummary['items']
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | symbol | null>(null)

interface Model {
	ord: number | null
	permitItem: string | null
	description: string | null
	amount: number
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

const valid = computed(() => !!model.value?.permitItem && model.value.amount > 0)

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
			// With a single line there is nothing to choose.
			permitItem: props.permitItems.length === 1 ? props.permitItems[0]?.id ?? null : null,
			description: null,
			amount: 0,
		})
	},
	edit({ id, ...item }: { id: string | symbol | null } & Model) {
		openDialog(id, item)
	},
})

const permitItemLabel = (item: TravelPermitSummary['items'][number]) =>
	formatTravelCoded(item.costType) + (item.description ? `: ${item.description}` : '') +
	` (bis ${formatCurrency(item.amount, 'amount')})`

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

const id = useId()
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? 'Kosten bearbeiten' : 'Kosten hinzufügen'"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		.kern-form-input
			label.kern-label(:for="id") Geplante Kosten
			.kern-hint(:id="`${id}-hint`") Die Zeile der Genehmigung, zu der die Kosten gehören.
			.kern-form-input__select-wrapper
				select.kern-form-input__select(
					:id="id"
					v-model="model.permitItem"
					:aria-describedby="`${id}-hint`"
				)
					option(
						disabled
						:value="null"
					) - Bitte wählen -
					option(
						v-for="item of props.permitItems"
						:key="item.id"
						:value="item.id"
					) {{ permitItemLabel(item) }}
		KernCurrencyInput(
			v-model="model.amount"
			label="Tatsächliche Kosten"
		)
		TravelTextInput(
			v-model="model.description"
			label="Erläuterung"
			hint="Zum Beispiel die Hinfahrt oder die Nummer der Rechnung."
			optional
		)
</template>
