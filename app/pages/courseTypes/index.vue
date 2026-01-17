<script setup lang="ts">
import { FetchError } from 'ofetch'
import { CourseTypeEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()

const { data, refresh } = useFetch('/api/courseTypes')

const editor = useTemplateRef<typeof CourseTypeEditor>('editor')

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
		title: 'Abschluss löschen?',
		text: 'Sind Sie sicher, dass Sie diesen Abschluss löschen möchten?',
	})) {
		try {
			await $fetch(`/api/courseTypes/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Abschlüsse
KernTable(
	caption="Liste der Abschlüsse"
	create-permission="courseTypes.create"
	update-permission="courseTypes.update"
	delete-permission="courseTypes.delete"
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
CourseTypeEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
