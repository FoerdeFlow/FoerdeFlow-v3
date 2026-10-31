<script setup lang="ts">
import { FetchError } from 'ofetch'

import { TravelTransportModeEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()

const { data, refresh } = useFetch('/api/travelTransportModes')

const editor = useTemplateRef<typeof TravelTransportModeEditor>('editor')

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
		title: 'Verkehrsmittel löschen?',
		text: 'Sind Sie sicher, dass Sie dieses Verkehrsmittel löschen möchten?',
	})) {
		try {
			await $fetch(`/api/travelTransportModes/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Verkehrsmittel
KernTable(
	caption="Liste der Verkehrsmittel"
	create-permission="travelTransportModes.create"
	update-permission="travelTransportModes.update"
	delete-permission="travelTransportModes.delete"
	:columns="[ 'name', 'reasonRequired' ]"
	:data="data || []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		| {{ formatTravelCoded(item) }}
	template(#reasonRequired-header)
		| Begründung erforderlich
	template(#reasonRequired-body="{ item }")
		| {{ item.reasonRequired ? 'Ja' : 'Nein' }}
TravelTransportModeEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
