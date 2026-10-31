<script setup lang="ts">
import { FetchError } from 'ofetch'

import { TravelCostTypeEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()

const { data, refresh } = useFetch('/api/travelCostTypes')

const editor = useTemplateRef<typeof TravelCostTypeEditor>('editor')

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
		title: 'Dienstreisekostenart löschen?',
		text: 'Sind Sie sicher, dass Sie diese Dienstreisekostenart löschen möchten?',
	})) {
		try {
			await $fetch(`/api/travelCostTypes/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Dienstreisekostenarten
KernTable(
	caption="Liste der Dienstreisekostenarten"
	create-permission="travelCostTypes.create"
	update-permission="travelCostTypes.update"
	delete-permission="travelCostTypes.delete"
	:columns="[ 'name' ]"
	:data="data || []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		| {{ formatTravelCoded(item) }}
TravelCostTypeEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
