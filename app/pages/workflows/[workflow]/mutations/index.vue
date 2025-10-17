<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { WorkflowMutationEditor } from '#components'

const route = useRoute('workflows-workflow-mutations')
const { data: workflow } = useFetch(`/api/workflows/${route.params.workflow}`)
const { data, refresh } = useFetch('/api/workflowMutations', {
	query: {
		workflow: route.params.workflow,
	},
})

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const editor = useTemplateRef<typeof WorkflowMutationEditor>('editor')

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
		title: 'Workflow-Mutation löschen?',
		text: 'Sind Sie sicher, dass Sie diese Workflow-Mutation löschen möchten?',
	})) {
		try {
			await $fetch(`/api/workflowMutations/${id}`, { method: 'DELETE' })
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
aside
	NuxtLink.kern-link(
		:to="{ name: 'workflows-workflow', params: { workflow: route.params.workflow } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zu: {{ workflow?.name }} ({{ workflow?.code }})
h1.kern-heading-large Workflow-Mutationen
KernTable(
	caption="Liste der Workflow-Mutationen"
	:columns="[ 'table', 'type' ]"
	create-permission="workflowMutations.create"
	update-permission="workflowMutations.update"
	delete-permission="workflowMutations.delete"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#table-header)
		| Relation
	template(#table-body="{ item }")
		| {{ item.table }}
	template(#type-header)
		| Aktion
	template(#type-body="{ item }")
		| {{ item.action }}
WorkflowMutationEditor(
	ref="editor"
	:workflow="route.params.workflow"
	@refresh="refresh"
)
</template>
