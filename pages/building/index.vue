<script setup lang="ts">
import { BuildingEditor } from '#components'
import { FetchError } from 'ofetch'

const authStore = useAuthStore()
const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()

const { data, refresh } = useFetch('/api/buildings')

const editor = useTemplateRef<typeof BuildingEditor>('editor')

function create() {
	if(!editor.value) return
	editor.value.create()
}

async function edit({ id }: { id: string }) {
	if(!editor.value) return
	editor.value.edit(id)
}

async function remove({ id }: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: 'Gebäude löschen?',
		text: 'Sind Sie sicher, dass Sie dieses Gebäude löschen möchten?',
	})) {
		try {
			await $fetch(`/api/buildings/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: 'Fehler beim Löschen',
					text: e.data?.message || 'Ein unbekannter Fehler ist aufgetreten.',
				})
			}
		}
	}
}
</script>

<template lang="pug">
h1.kern-heading-large Gebäude
KernTable(
	caption="Liste der Gebäude"
	create-permission="buildings.create"
	update-permission="buildings.update"
	delete-permission="buildings.delete"
	:columns="['name']"
	:data="data || []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Nummer (Funktion)
		br
		em Anschrift
	template(#name-body="{ item }")
		| {{ item.code }} ({{ item.name }})
		br
		em {{ item.postalAddress }}
BuildingEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
