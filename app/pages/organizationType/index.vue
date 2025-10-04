<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { OrganizationTypeEditor } from '#components'

const { data, refresh } = useFetch('/api/organizationTypes')

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const editor = useTemplateRef<typeof OrganizationTypeEditor>('editor')

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
		title: 'OE-Kategorie löschen?',
		text: 'Sind Sie sicher, dass Sie diese OE-Kategorie löschen möchten?',
	})) {
		try {
			await $fetch(`/api/organizationTypes/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large OE-Kategorien
KernTable(
	caption="Liste der OE-Kategorien"
	:columns="[ 'name' ]"
	create-permission="organizationTypes.create"
	update-permission="organizationTypes.update"
	delete-permission="organizationTypes.delete"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		| {{ item.name }} ({{ item.code }})
OrganizationTypeEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
