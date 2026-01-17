<script setup lang="ts">
import { FetchError } from 'ofetch'
import { CourseEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()

const { data, refresh } = useFetch('/api/courses')

const editor = useTemplateRef<typeof CourseEditor>('editor')

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
		title: 'Studiengang löschen?',
		text: 'Sind Sie sicher, dass Sie diesen Studiengang löschen möchten?',
	})) {
		try {
			await $fetch(`/api/courses/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Studiengänge
KernTable(
	caption="Liste der Studiengänge"
	create-permission="courses.create"
	update-permission="courses.update"
	delete-permission="courses.delete"
	:columns="['name']"
	:data="data || []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		em Abschluss
		br
		| Name (Kürzel)
	template(#name-body="{ item }")
		em {{ formatCourseType(item.type) }}
		br
		| {{ item.name }} ({{ item.code }})
CourseEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
