<script setup lang="ts">
import type { LongtermContractItemType, LongtermContractTimeUnit } from '~/types'

import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

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

function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = structuredClone(data)
	model.value = structuredClone(data)
	dialog.value.show()
}

defineExpose({
	create() {
		openDialog(null, {
			ord: null,
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
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		.kern-fieldset__body.kern-fieldset__body--horizontal
			LongtermContractItemOrdInput(
				v-model="model.ord"
			)
			LongtermContractItemTitleInput.flex-1(
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
