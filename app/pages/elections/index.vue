<script setup lang="ts">
import { FetchError } from 'ofetch'
import { ElectionEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()

const { data, refresh } = useFetch('/api/elections')

const editor = useTemplateRef<typeof ElectionEditor>('editor')

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
		title: 'Wahl löschen?',
		text: 'Sind Sie sicher, dass Sie diese Wahl löschen möchten?',
	})) {
		try {
			await $fetch(`/api/elections/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Wahlen
KernTable(
	caption="Liste der Wahlen"
	create-permission="elections.create"
	update-permission="elections.update"
	delete-permission="elections.delete"
	:columns="['title', 'date']"
	:data="data || []"
	show-actions
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#title-header)
		| Titel
	template(#title-body="{ item }")
		| {{ item.title }}
	template(#date-header)
		| Datum (Wahlstichtag)
	template(#date-body="{ item }")
		| {{ formatDate(item.date) }}
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to="{ name: 'elections-election', params: { election: item.id } }"
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
ElectionEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
