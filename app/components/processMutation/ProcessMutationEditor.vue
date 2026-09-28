<script setup lang="ts">
import { FetchError } from 'ofetch'

import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)
const itemModel = ref<string | null>(null)
const model = ref<unknown>(null)
const parsable = ref(true)

const modified = computed(() => {
	if(itemModel.value === null) return false
	return itemModel.value !== JSON.stringify(model.value)
})

// The model keeps the last value that parsed while the text does not, so saving
// waits for the text itself. An application is always an object, never a list
// and never empty, so anything else is refused before it reaches the server.
const valid = computed(() =>
	parsable.value &&
	typeof model.value === 'object' &&
	model.value !== null &&
	!Array.isArray(model.value))

defineExpose({
	async open(id: string) {
		if(!dialog.value) return
		const item = await $fetch(`/api/processMutations/${id}`)
		itemId.value = id
		itemModel.value = JSON.stringify(item.data)
		model.value = item.data
		parsable.value = true
		dialog.value.show()
	},
})

const warning = 'Der Inhalt wird beim Speichern genauso geprüft wie bei der ' +
	'Antragstellung. Bereits abgeschlossene Schritte und eingegangene Unterschriften ' +
	'werden dabei nicht zurückgesetzt, und Anhänge wie Fotos bleiben unverändert.'

const hint = 'Die Felder, die sich aus dem Antrag selbst ergeben – etwa die Person oder ' +
	'der Haushalt –, sind nicht enthalten und werden beim Speichern neu bestimmt.'

const emit = defineEmits<{
	refresh: []
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

async function save() {
	if(!dialog.value) return
	try {
		await $fetch(`/api/processMutations/${itemId.value}`, {
			method: 'PUT',
			body: {
				data: model.value,
			},
		})
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: 'Fehler bei der Bearbeitung',
				text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	title="Prozessinhalt bearbeiten"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	KernAlert(
		type="warning"
		:dismissible="false"
		title="Inhalt eines laufenden Antrags"
		:text="warning"
	)
	KernJsonInput(
		v-if="itemId"
		v-model="model"
		v-model:valid="parsable"
		label="Inhalt als JSON"
		:hint="hint"
		:rows="24"
	)
</template>
