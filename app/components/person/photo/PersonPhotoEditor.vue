<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { KernDialog } from '#components'

const itemId = ref<string | null>(null)
const model = ref<File | null>(null)
const dialog = useTemplateRef<typeof KernDialog>('dialog')

defineExpose({
	async edit(id: string) {
		if(!dialog.value) return
		itemId.value = id
		await nextTick()
		dialog.value.show()
	},
})

const emit = defineEmits<{
	refresh: [],
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

async function save() {
	if(!dialog.value) return
	try {
		await $fetch(`/api/persons/${itemId.value}/photo`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/octet-stream',
			},
			body: model.value,
		})
		emit('refresh')
		dialog.value.hide()
		itemId.value = null
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

async function unlinkFile() {
	if(!dialog.value) return
	try {
		await $fetch(`/api/persons/${itemId.value}/photo`, {
			method: 'DELETE',
		})
		emit('refresh')
		dialog.value.hide()
		itemId.value = null
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
	title="Lichtbild bearbeiten"
	:modal="true"
	@cancel="cancel"
	@save="save"
)
	template(v-if="itemId")
		PersonPhotoInput(
			v-model="model"
		)
		button.kern-btn.kern-btn--secondary(
			@click="unlinkFile"
		)
			span.kern-icon.kern-icon--delete(aria-hidden="true")
			span.kern-label Bild entfernen
</template>
