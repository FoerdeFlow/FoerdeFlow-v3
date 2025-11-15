<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { DocumentEditor, DocumentContentEditor } from '#components'

const authStore = useAuthStore()
const route = useRoute('organizationItems-organizationItem-documents')
const { data, refresh } = useFetch('/api/documents', {
	query: {
		organizationItem: route.params.organizationItem,
		published: authStore
			.hasPermission('documents.update', { organizationItem: route.params.organizationItem }).value
			? 'all'
			: 'yes',
	},
})

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const editor = useTemplateRef<typeof DocumentEditor>('editor')
const contentEditor = useTemplateRef<typeof DocumentContentEditor>('contentEditor')
const transferDialog = useTemplateRef<typeof DocumentTransferDialog>('transferDialog')

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
		title: 'Vorlage löschen?',
		text: 'Sind Sie sicher, dass Sie diese Vorlage löschen möchten?',
	})) {
		try {
			await $fetch(`/api/documents/${id}`, { method: 'DELETE' })
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

function downloadDocument(id: string) {
	window.open(`/api/documents/${id}/pdf`, '_blank')
}

function uploadDocument(id: string) {
	if(!contentEditor.value) return
	contentEditor.value.edit(id)
}

function transferToOpenslides(id: string) {
	if(!transferDialog.value) return
	transferDialog.value.transfer(id)
}
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to=`{
			name: 'organizationItems-organizationItem',
			params: { organizationItem: route.params.organizationItem },
		}`
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zum Gremium
h1.kern-heading-large Vorlagen
KernTable(
	caption="Liste der Vorlagen"
	:columns="[ 'number', 'type', 'name' ]"
	create-permission="documents.create"
	update-permission="documents.update"
	delete-permission="documents.delete"
	:show-actions="data?.some((item) => item.hasContent) ?? false"
	:scope="{ organizationItem: route.params.organizationItem }"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#number-header)
		| Nummer
	template(#number-body="{ item }")
		| {{ formatDocumentNumber(item.period, item.number) }}
	template(#type-header)
		| Vorlagenart
		br
		| Autor
	template(#type-body="{ item }")
		| {{ item.type.name }}
		br
		template(v-if="item.authorOrganizationItem")
			| {{ formatOrganizationItem(item.authorOrganizationItem) }}
		template(v-else-if="item.authorPerson")
			| {{ formatPerson(item.authorPerson) }}
	template(#name-header)
		| Name
	template(#name-body="{ item }")
		| {{ item.title }}
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			v-if="item.hasContent"
			@click="downloadDocument(item.id)"
		)
			span.kern-icon.kern-icon--download(aria-hidden="true")
			span.kern-label.kern-sr-only Herunterladen (PDF)
		button.kern-btn.kern-btn--tertiary(
			v-if="authStore.hasPermission('documents.update', { organizationItem: route.params.organizationItem }).value"
			@click="uploadDocument(item.id)"
		)
			span.kern-icon.kern-icon--drive-folder-upload(aria-hidden="true")
			span.kern-label.kern-sr-only Dokument bearbeiten
		button.kern-btn.kern-btn--tertiary(
			v-if="item.hasContent && authStore.hasPermission('documents.update', { organizationItem: route.params.organizationItem }).value"
			@click="transferToOpenslides(item.id)"
		)
			span.kern-icon.kern-icon--content-copy(aria-hidden="true")
			span.kern-label.kern-sr-only Zu OpenSlides übertragen
DocumentEditor(
	ref="editor"
	:organization-item="route.params.organizationItem"
	@refresh="refresh"
)
DocumentContentEditor(
	ref="contentEditor"
	@refresh="refresh"
)
DocumentTransferDialog(
	ref="transferDialog"
	:organization-item="route.params.organizationItem"
)
</template>
