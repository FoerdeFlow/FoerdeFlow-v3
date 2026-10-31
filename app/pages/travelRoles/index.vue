<script setup lang="ts">
import { FetchError } from 'ofetch'

import { TravelRoleEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()

const { data, refresh } = useFetch('/api/travelRoles')

const editor = useTemplateRef<typeof TravelRoleEditor>('editor')

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
		title: 'Dienstreiserolle löschen?',
		text: 'Sind Sie sicher, dass Sie diese Dienstreiserolle löschen möchten?',
	})) {
		try {
			await $fetch(`/api/travelRoles/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Dienstreiserollen
KernTable(
	caption="Liste der Dienstreiserollen"
	create-permission="travelRoles.create"
	update-permission="travelRoles.update"
	delete-permission="travelRoles.delete"
	:columns="[ 'name', 'organizationItem', 'budget' ]"
	:data="data || []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Name (Kürzel)
	template(#name-body="{ item }")
		| {{ formatTravelCoded(item) }}
	template(#organizationItem-header)
		| Organisationseinheit
	template(#organizationItem-body="{ item }")
		| {{ formatTravelCoded(item.organizationItem) }}
	template(#budget-header)
		| Haushalt
	template(#budget-body="{ item }")
		| {{ formatTravelCoded(item.budget) }}
TravelRoleEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
