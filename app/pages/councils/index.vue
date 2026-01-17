<script setup lang="ts">
import { FetchError } from 'ofetch'
import { CouncilEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()

const { data, refresh } = useFetch('/api/councils')

const editor = useTemplateRef<typeof CouncilEditor>('editor')

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
		title: 'Fachschaft löschen?',
		text: 'Sind Sie sicher, dass Sie diese Fachschaft löschen möchten?',
	})) {
		try {
			await $fetch(`/api/councils/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Fachschaften
KernTable(
	caption="Liste der Fachschaften"
	create-permission="councils.create"
	update-permission="councils.update"
	delete-permission="councils.delete"
	:columns="['name']"
	:data="data || []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		| {{ item.name }} ({{ item.code }})
CouncilEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
