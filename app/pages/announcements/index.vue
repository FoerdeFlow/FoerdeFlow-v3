<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { AnnouncementEditor } from '#components'

const { data, refresh } = useFetch('/api/announcements')

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const editor = useTemplateRef<typeof AnnouncementEditor>('editor')

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
		title: 'Ankündigung löschen?',
		text: 'Sind Sie sicher, dass Sie diese Ankündigung löschen möchten?',
	})) {
		try {
			await $fetch(`/api/announcements/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Ankündigungen
KernTable(
	caption="Liste der Ankündigungen"
	:columns="[ 'title' ]"
	create-permission="announcements.create"
	update-permission="announcements.update"
	delete-permission="announcements.delete"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#title-header)
		| Titel
	template(#title-body="{ item }")
		| {{ item.title }}
AnnouncementEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
