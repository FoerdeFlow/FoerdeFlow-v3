<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { Location } from '~/types'

import { KernDialog } from '#components'

const props = defineProps<{
	organizationItem: string
}>()

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	inventoryNumber: string | null
	name: string
	description: string | null
	location: Location
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
			inventoryNumber: null,
			name: '',
			description: null,
			location: null,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/inventoryItems/${id}`)
		openDialog(id, {
			inventoryNumber: item.inventoryNumber,
			name: item.name,
			description: item.description,
			location: item.location,
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

// Ohne Bezeichnung wäre der Gegenstand in der Liste nicht wiederzuerkennen.
const valid = computed(() => Boolean(model.value?.name))

async function save() {
	if(!dialog.value || !model.value) return
	try {
		const body = {
			inventoryNumber: model.value.inventoryNumber,
			name: model.value.name,
			description: model.value.description,
			location: model.value.location?.id ?? null,
		}
		if(itemId.value) {
			await $fetch(`/api/inventoryItems/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/inventoryItems', {
				method: 'POST',
				body: {
					...body,
					organizationItem: props.organizationItem,
				},
			})
		}
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: itemId.value
					? t('inventoryItem.edit.error.title')
					: t('inventoryItem.create.error.title'),
				text: e.data?.message ?? (itemId.value
					? t('inventoryItem.edit.error.message')
					: t('inventoryItem.create.error.message')
				),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('inventoryItem.edit.title') : $t('inventoryItem.create.title')"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		InventoryItemNumberInput(v-model="model.inventoryNumber")
		InventoryItemNameInput(v-model="model.name")
		InventoryItemDescriptionInput(v-model="model.description")
		InventoryItemLocationInput(v-model="model.location")
</template>
