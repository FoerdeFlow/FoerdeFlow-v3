<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { WorkflowEditor } from '#components'

const { data, refresh } = useFetch('/api/workflows')

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const editor = useTemplateRef<typeof WorkflowEditor>('editor')

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
		title: 'Workflow löschen?',
		text: 'Sind Sie sicher, dass Sie diesen Workflow löschen möchten?',
	})) {
		try {
			await $fetch(`/api/workflows/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Workflows
KernTable(
	caption="Liste der Workflows"
	:columns="[ 'name' ]"
	create-permission="workflows.create"
	update-permission="workflows.update"
	delete-permission="workflows.delete"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		| {{ item.name }} ({{ item.code }})
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to="{ name: 'workflows-workflow', params: { workflow: item.id } }"
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
WorkflowEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
