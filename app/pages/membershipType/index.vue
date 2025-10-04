<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { MembershipTypeEditor } from '#components'

const { data, refresh } = useFetch('/api/membershipTypes')

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const editor = useTemplateRef<typeof MembershipTypeEditor>('editor')

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
		title: 'Mitgliedschaftsart löschen?',
		text: 'Sind Sie sicher, dass Sie diese Mitgliedschaftsart löschen möchten?',
	})) {
		try {
			await $fetch(`/api/membershipTypes/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Mitgliedschaftsarten
KernTable(
	caption="Liste der Mitgliedschaftsarten"
	:columns="[ 'name' ]"
	create-permission="membershipTypes.create"
	update-permission="membershipTypes.update"
	delete-permission="membershipTypes.delete"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		| {{ item.name }} ({{ item.code }})
MembershipTypeEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
