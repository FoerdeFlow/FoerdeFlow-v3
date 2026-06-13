<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { LongtermContractItemInput } from '~/types'

import { KernDialog } from '#components'

const props = defineProps<{
	budget: string
	readonly?: boolean
}>()

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	title: string
	description: string | null
	startDate: Date | null
	endDate: Date | null
	items: LongtermContractItemInput[]
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
			title: '',
			description: null,
			startDate: null,
			endDate: null,
			items: [],
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/longtermContracts/${id}`)
		openDialog(id, {
			title: item.title,
			description: item.description,
			startDate: item.startDate ? new Date(item.startDate) : null,
			endDate: item.endDate ? new Date(item.endDate) : null,
			items: item.items,
		})
	},
})

const emit = defineEmits<{
	refresh: []
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

async function save() {
	if(!dialog.value || !model.value) return
	try {
		const body = {
			budget: props.budget,
			title: model.value.title,
			description: model.value.description,
			startDate: serializeDate(model.value.startDate),
			endDate: serializeDate(model.value.endDate),
			items: model.value.items,
		}
		if(itemId.value) {
			await $fetch(`/api/longtermContracts/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/longtermContracts', {
				method: 'POST',
				body,
			})
		}
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: itemId.value
					? t('longtermContract.edit.error.title')
					: t('longtermContract.create.error.title'),
				text: e.data?.message ?? (itemId.value
					? t('longtermContract.edit.error.message')
					: t('longtermContract.create.error.message')
				),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('longtermContract.edit.title') : $t('longtermContract.create.title')"
	:modal="modified"
	:readonly="props.readonly"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		LongtermContractTitleInput(
			v-model="model.title"
			:readonly="props.readonly"
		)
		LongtermContractDescriptionInput(
			v-model="model.description"
			:readonly="props.readonly"
		)
		.kern-fieldset__body.kern-fieldset__body--horizontal
			LongtermContractStartDateInput.flex-1(
				v-model="model.startDate"
				:readonly="props.readonly"
			)
			LongtermContractEndDateInput.flex-1(
				v-model="model.endDate"
				:readonly="props.readonly"
			)
		LongtermContractItemsInput(v-model="model.items")
</template>
