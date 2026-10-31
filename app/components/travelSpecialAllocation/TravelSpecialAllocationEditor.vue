<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { Budget } from '~/types'

import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	code: string
	name: string
	budget: Budget
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => !!itemModel.value && !!model.value &&
	JSON.stringify(itemModel.value) !== JSON.stringify(model.value))

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
			code: '',
			name: '',
			budget: null,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/travelSpecialAllocations/${id}`)
		openDialog(id, item)
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
			code: model.value.code,
			name: model.value.name,
			budget: model.value.budget?.id,
		}
		if(itemId.value) {
			await $fetch(`/api/travelSpecialAllocations/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/travelSpecialAllocations', {
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
				title: `Fehler bei der ${itemId.value ? 'Bearbeitung' : 'Erstellung'}`,
				text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="`Sonderzuweisung ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		TravelSpecialAllocationCodeInput(v-model="model.code")
		TravelSpecialAllocationNameInput(v-model="model.name")
		TravelSpecialAllocationBudgetInput(v-model="model.budget")
</template>
