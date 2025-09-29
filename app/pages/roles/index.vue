<script setup lang="ts">
import { FetchError } from 'ofetch'
import { RoleEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()

const { data, refresh } = useFetch('/api/roles')

const editor = useTemplateRef<typeof RoleEditor>('editor')

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
		title: 'Rolle löschen?',
		text: 'Sind Sie sicher, dass Sie diese Rolle löschen möchten?',
	})) {
		try {
			await $fetch(`/api/roles/${id}`, { method: 'DELETE' })
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
		:to="{ name: 'index' }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Übersicht
h1.kern-heading-large Rollen
KernTable(
	caption="Liste der Rollen"
	create-permission="roles.create"
	update-permission="roles.update"
	delete-permission="roles.delete"
	show-actions
	:columns="['name']"
	:data="data || []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		span.mr-8 {{ item.name }} ({{ item.code }})
		RoleIsAdminBadge(:is-admin="item.isAdmin")
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to="{ name: 'roles-role', params: { role: item.id } }"
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
RoleEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
