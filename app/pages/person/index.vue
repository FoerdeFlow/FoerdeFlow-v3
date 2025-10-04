<script setup lang="ts">
import { FetchError } from 'ofetch'
import { PersonEditor } from '#components'

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()

const { data, refresh } = useFetch('/api/persons')

const editor = useTemplateRef<typeof PersonEditor>('editor')

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
		title: 'Person löschen?',
		text: 'Sind Sie sicher, dass Sie diese Person löschen möchten?',
	})) {
		try {
			await $fetch(`/api/persons/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Personen
KernTable(
	caption="Liste der Personen"
	:columns="[ 'name', 'email' ]"
	create-permission="persons.create"
	update-permission="persons.update"
	delete-permission="persons.delete"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Pronomen)
	template(#name-body="{ item }")
		| {{ item.firstName }}
		template(v-if="item.callName")
			|
			| "{{ item.callName }}"
		|
		| {{ item.lastName }}
		template(v-if="item.pronouns")
			|
			| ({{ item.pronouns }})
	template(#email-header)
		| E-Mail-Adresse
	template(#email-body="{ item }")
		| {{ item.email }}
PersonEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
