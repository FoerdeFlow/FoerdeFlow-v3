<script setup lang="ts">
import { FetchError } from 'ofetch'

import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	code: string
	name: string
	reasonRequired: boolean
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
			reasonRequired: false,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/travelTransportModes/${id}`)
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
			reasonRequired: model.value.reasonRequired,
		}
		if(itemId.value) {
			await $fetch(`/api/travelTransportModes/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/travelTransportModes', {
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
	:title="`Verkehrsmittel ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		TravelTransportModeCodeInput(v-model="model.code")
		TravelTransportModeNameInput(v-model="model.name")
		TravelTransportModeReasonRequiredInput(v-model="model.reasonRequired")
</template>
