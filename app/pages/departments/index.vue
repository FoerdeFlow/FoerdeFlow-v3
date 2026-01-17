<script setup lang="ts">
import { FetchError } from 'ofetch'
import { DepartmentEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()

const { data, refresh } = useFetch('/api/departments')

const editor = useTemplateRef<typeof DepartmentEditor>('editor')

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
		title: 'Fachbereich löschen?',
		text: 'Sind Sie sicher, dass Sie diesen Fachbereich löschen möchten?',
	})) {
		try {
			await $fetch(`/api/departments/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Fachbereiche
KernTable(
	caption="Liste der Fachbereiche"
	create-permission="departments.create"
	update-permission="departments.update"
	delete-permission="departments.delete"
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
DepartmentEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
