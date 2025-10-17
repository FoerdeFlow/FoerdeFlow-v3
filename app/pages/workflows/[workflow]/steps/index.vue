<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { WorkflowStepEditor } from '#components'

const route = useRoute('workflows-workflow-steps')
const { data: workflow } = useFetch(`/api/workflows/${route.params.workflow}`)
const { data, refresh } = useFetch('/api/workflowSteps', {
	query: {
		workflow: route.params.workflow,
	},
})

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const editor = useTemplateRef<typeof WorkflowStepEditor>('editor')

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
		title: 'Workflow-Schritte löschen?',
		text: 'Sind Sie sicher, dass Sie diesen Workflow-Schritt löschen möchten?',
	})) {
		try {
			await $fetch(`/api/workflowSteps/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Workflow-Schritte
KernTable(
	caption="Liste der Workflow-Schritte"
	:columns="[ 'name', 'assignee' ]"
	create-permission="workflowSteps.create"
	update-permission="workflowSteps.update"
	delete-permission="workflowSteps.delete"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		| {{ item.name }} ({{ item.code }})
	template(#assignee-header)
		| Zuordnung
	template(#assignee-body="{ item }")
		| {{ formatWorkflowStepType(item.type) }}
		|
		em
			| durch
			|
		template(v-if="item.assignee === 'initiator'")
			| Initiator*in
		template(v-if="item.assignee === 'organizationItem'")
			| {{ formatOrganizationItem(item.assigneeOrganizationItem) }}
WorkflowStepEditor(
	ref="editor"
	:workflow="route.params.workflow"
	@refresh="refresh"
)
</template>
