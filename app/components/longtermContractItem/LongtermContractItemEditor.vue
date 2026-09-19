<script setup lang="ts">
import type { LongtermContractItemType, LongtermContractTimeUnit } from '~/types'

import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const props = defineProps<{
	/** The ordinals of the other items of the contract, not to be repeated. */
	usedOrds?: number[]
}>()

const itemId = ref<string | null>(null)

interface Model {
	ord: number | null
	type: LongtermContractItemType
	title: string
	description: string | null
	amount: number
	timeUnit: LongtermContractTimeUnit | null
	usageUnit: string | null
	expectedUsage: number | null
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

const ordValid = computed(() => {
	const ord = model.value?.ord
	return typeof ord === 'number' && Number.isInteger(ord) && ord >= 1 &&
		!props.usedOrds?.includes(ord)
})

const valid = computed(() => {
	if(!model.value) return false
	return ordValid.value && model.value.title.trim() !== ''
})

function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = structuredClone(data)
	model.value = structuredClone(data)
	dialog.value.show()
}

defineExpose({
	create(ord: number) {
		openDialog(null, {
			ord,
			type: 'time',
			title: '',
			description: null,
			amount: 0,
			timeUnit: null,
			usageUnit: null,
			expectedUsage: null,
		})
	},
	edit({ id, ...item }: { id: string } & Model) {
		openDialog(id, item)
	},
})

const emit = defineEmits<{
	save: [string | null, Model]
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

function save() {
	if(!dialog.value || !model.value) return
	if(model.value.type !== 'usage') {
		model.value.usageUnit = null
		model.value.expectedUsage = null
	}
	if(model.value.type === 'fixed') {
		model.value.timeUnit = null
	}
	dialog.value.hide()
	emit('save', itemId.value, model.value)
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('longtermContractItem.edit.title') : $t('longtermContractItem.create.title')"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		LongtermContractItemOrdInput(
			v-model="model.ord"
			:used-ords="props.usedOrds"
		)
		LongtermContractItemTitleInput(
			v-model="model.title"
		)
		LongtermContractItemTypeInput(
			v-model="model.type"
		)
		.kern-fieldset__body.kern-fieldset__body--horizontal
			LongtermContractItemAmountInput.flex-1(
				v-model="model.amount"
			)
			template(v-if="model.type === 'time'")
				LongtermContractItemTimeUnitInput.flex-1(
					v-model="model.timeUnit"
				)
			template(v-if="model.type === 'usage'")
				LongtermContractItemUsageUnitInput.flex-1(
					v-model="model.usageUnit"
				)
		.kern-fieldset__body.kern-fieldset__body--horizontal(v-if="model.type === 'usage'")
			LongtermContractItemExpectedUsageInput.flex-1(
				v-model="model.expectedUsage"
			)
			LongtermContractItemTimeUnitInput.flex-1(
				v-model="model.timeUnit"
			)
		LongtermContractItemDescriptionInput(
			v-model="model.description"
		)
</template>
