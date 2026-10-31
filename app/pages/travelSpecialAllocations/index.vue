<script setup lang="ts">
import { FetchError } from 'ofetch'

import { TravelSpecialAllocationEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()

const { data, refresh } = useFetch('/api/travelSpecialAllocations')

const editor = useTemplateRef<typeof TravelSpecialAllocationEditor>('editor')

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
		title: 'Sonderzuweisung löschen?',
		text: 'Sind Sie sicher, dass Sie diese Sonderzuweisung löschen möchten?',
	})) {
		try {
			await $fetch(`/api/travelSpecialAllocations/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Sonderzuweisungen für Dienstreisen
KernTable(
	caption="Liste der Sonderzuweisungen für Dienstreisen"
	create-permission="travelSpecialAllocations.create"
	update-permission="travelSpecialAllocations.update"
	delete-permission="travelSpecialAllocations.delete"
	:columns="[ 'name', 'budget' ]"
	:data="data || []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		| {{ formatTravelCoded(item) }}
	template(#budget-header)
		| Haushalt
	template(#budget-body="{ item }")
		| {{ formatTravelCoded(item.budget) }}
TravelSpecialAllocationEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
