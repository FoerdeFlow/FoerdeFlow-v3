<script setup lang="ts">
import { FetchError } from 'ofetch'

import { TravelTransportReasonEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()

const { data, refresh } = useFetch('/api/travelTransportReasons')

const editor = useTemplateRef<typeof TravelTransportReasonEditor>('editor')

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
		title: 'Grund löschen?',
		text: 'Sind Sie sicher, dass Sie diesen Grund löschen möchten?',
	})) {
		try {
			await $fetch(`/api/travelTransportReasons/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Gründe für die Wahl des Verkehrsmittels
KernTable(
	caption="Liste der Gründe für die Wahl des Verkehrsmittels"
	create-permission="travelTransportReasons.create"
	update-permission="travelTransportReasons.update"
	delete-permission="travelTransportReasons.delete"
	:columns="[ 'name', 'transportModes', 'roles' ]"
	:data="data || []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		| {{ formatTravelCoded(item) }}
	template(#transportModes-header)
		| Verkehrsmittel
	template(#transportModes-body="{ item }")
		| {{ item.transportModes.map((transportMode) => formatTravelCoded(transportMode)).join(', ') }}
	template(#roles-header)
		| Dienstreiserollen
	template(#roles-body="{ item }")
		| {{ item.roles.length > 0 ? item.roles.map((role) => formatTravelCoded(role)).join(', ') : 'alle' }}
TravelTransportReasonEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
