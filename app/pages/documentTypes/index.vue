<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { DocumentTypeEditor } from '#components'

const { data, refresh } = useFetch('/api/documentTypes')

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const editor = useTemplateRef<typeof DocumentTypeEditor>('editor')

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
		title: 'Vorlagenart löschen?',
		text: 'Sind Sie sicher, dass Sie diese Vorlagenart löschen möchten?',
	})) {
		try {
			await $fetch(`/api/documentTypes/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Vorlagenarten
KernTable(
	caption="Liste der Vorlagenarten"
	:columns="[ 'name' ]"
	create-permission="documentTypes.create"
	update-permission="documentTypes.update"
	delete-permission="documentTypes.delete"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		| {{ item.name }} ({{ item.code }})
DocumentTypeEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
