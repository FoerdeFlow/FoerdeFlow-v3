<script setup lang="ts">
import { FetchError } from 'ofetch'
import { PersonEditor, PersonPhotoEditor } from '#components'

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const authStore = useAuthStore()

const { data, refresh } = useFetch('/api/persons')

const editor = useTemplateRef<typeof PersonEditor>('editor')
const photoEditor = useTemplateRef<typeof PersonPhotoEditor>('photo-editor')

function create() {
	if(!editor.value) return
	editor.value.create()
}

function edit({ id }: { id: string }) {
	if(!editor.value) return
	editor.value.edit(id)
}

function uploadPhoto(id: string) {
	if(!photoEditor.value) return
	photoEditor.value.edit(id)
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
	:columns="[ 'photo', 'name', 'email' ]"
	create-permission="persons.create"
	update-permission="persons.update"
	delete-permission="persons.delete"
	:data="data ?? []"
	:show-actions="authStore.hasPermission('persons.update').value"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#photo-header)
		| Lichtbild
	template(#photo-body="{ item }")
		template(v-if="item.hasPhoto")
			img(
				:src="`/api/persons/${item.id}/photo`"
				:alt="`Lichtbild von ${formatPerson(item)}`"
				width="50"
				height="50"
				style="border: 1px solid black; border-radius: 4px;"
			)
		template(v-else)
			span.kern-icon.kern-icon--close(aria-hidden="true")
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
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			v-if="authStore.hasPermission('persons.update').value"
			@click="uploadPhoto(item.id)"
		)
			span.kern-icon.kern-icon--drive-folder-upload(aria-hidden="true")
			span.kern-label.kern-sr-only Lichtbild bearbeiten
PersonEditor(
	ref="editor"
	@refresh="refresh"
)
PersonPhotoEditor(
	ref="photo-editor"
	@refresh="refresh"
)
</template>
