<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { WorkflowAllowedInitiatorEditor } from '#components'

const route = useRoute('workflows-workflow-allowedInitiators')
const { data: workflow } = useFetch(`/api/workflows/${route.params.workflow}`)
const { data, refresh } = useFetch('/api/workflowAllowedInitiators', {
	query: {
		workflow: route.params.workflow,
	},
})

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const editor = useTemplateRef<typeof WorkflowAllowedInitiatorEditor>('editor')

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
		title: 'Zugelassenen Workflow-Initiator löschen?',
		text: 'Sind Sie sicher, dass Sie diesen Workflow-Initiator löschen möchten?',
	})) {
		try {
			await $fetch(`/api/workflowAllowedInitiators/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Zugelassene Workflow-Initiatoren
KernTable(
	caption="Liste der Workflow-Initiatoren"
	:columns="[ 'initiator' ]"
	create-permission="workflowAllowedInitiators.create"
	update-permission="workflowAllowedInitiators.update"
	delete-permission="workflowAllowedInitiators.delete"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#initiator-header)
		| Initiator
	template(#initiator-body="{ item }")
		template(v-if="item.person")
			| {{ formatPerson(item.person) }}
		template(v-else-if="item.role")
			| {{ formatRole(item.role) }}
		template(v-else-if="item.organizationType")
			| {{ formatOrganizationType(item.organizationType) }}
		template(v-else-if="item.organizationItem")
			| {{ formatOrganizationItem(item.organizationItem) }}
WorkflowAllowedInitiatorEditor(
	ref="editor"
	:workflow="route.params.workflow"
	@refresh="refresh"
)
</template>
