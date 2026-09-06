<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { WorkflowSignatureEditor } from '#components'

const route = useRoute('workflows-workflow-signatures')
const { data: workflow } = useFetch(`/api/workflows/${route.params.workflow}`)
const { data, refresh } = useFetch('/api/workflowSignatures', {
	query: {
		workflow: route.params.workflow,
	},
})

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const editor = useTemplateRef<typeof WorkflowSignatureEditor>('editor')

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
		title: 'Unterschrift löschen?',
		text: 'Sind Sie sicher, dass Sie diese Unterschrift löschen möchten?',
	})) {
		try {
			await $fetch(`/api/workflowSignatures/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Unterschriften
KernTable(
	caption="Liste der erforderlichen Papierunterschriften"
	:columns="[ 'name', 'mutation', 'assignee' ]"
	create-permission="workflowSignatures.create"
	update-permission="workflowSignatures.update"
	delete-permission="workflowSignatures.delete"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		| {{ item.name }} ({{ item.code }})
		template(v-if="item.description")
			br
			KernText(
				size="small"
				:text="item.description"
			)
	template(#mutation-header)
		| Dokument
	template(#mutation-body="{ item }")
		| {{ item.mutation.table }} ({{ formatWorkflowMutationAction(item.mutation.action) }})
	template(#assignee-header)
		| Bestätigung durch
	template(#assignee-body="{ item }")
		template(v-if="item.assignee === 'initiator'")
			| Anforderer*in
		template(v-if="item.assignee === 'referencedPerson'")
			| {{ item.assigneeReferencedPerson }}
		template(v-if="item.assignee === 'organizationItem'")
			| {{ formatOrganizationItem(item.assigneeOrganizationItem) }}
WorkflowSignatureEditor(
	ref="editor"
	:workflow="route.params.workflow"
	@refresh="refresh"
)
</template>
