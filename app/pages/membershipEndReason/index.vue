<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { MembershipEndReasonEditor } from '#components'

const { data, refresh } = useFetch('/api/membershipEndReasons')

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const editor = useTemplateRef<typeof MembershipEndReasonEditor>('editor')

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
		title: 'Grund für Mitgliedschaftsende löschen?',
		text: 'Sind Sie sicher, dass Sie diesen Grund für das Mitgliedschaftsende löschen möchten?',
	})) {
		try {
			await $fetch(`/api/membershipEndReasons/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Gründe für das Ende der Mitgliedschaft
KernTable(
	caption="Liste der Gründe für das Ende der Mitgliedschaft"
	:columns="[ 'name' ]"
	create-permission="membershipEndReasons.create"
	update-permission="membershipEndReasons.update"
	delete-permission="membershipEndReasons.delete"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		| {{ item.name }} ({{ item.code }})
MembershipEndReasonEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
