<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { RoomEditor } from '#components'

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()

const { data, refresh } = useFetch('/api/rooms')

const editor = useTemplateRef<InstanceType<typeof RoomEditor>>('editor')

function create() {
	if(!editor.value) return
	editor.value.create()
}

function edit({ id }: { id: string }) {
	if(!editor.value) return
	editor.value.edit(id)
}

async function remove({ id }: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: 'Raum löschen?',
		text: 'Sind Sie sicher, dass Sie diesen Raum löschen möchten?',
	})) {
		try {
			await $fetch(`/api/rooms/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: 'Fehler beim Löschen',
					text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
				})
			}
		}
	}
}
</script>

<template lang="pug">
h1.kern-heading-large Räume
KernTable(
	caption="Liste der Räume"
	:columns="[ 'name' ]"
	create-permission="rooms.create"
	update-permission="rooms.update"
	delete-permission="rooms.delete"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Raumnummer (Funktion)
	template(#name-body="{ item }")
		| {{ formatRoom(item) }}
RoomEditor(
	ref="editor"
	@refresh="refresh()"
)
</template>
