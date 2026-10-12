<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { VehicleDriverEditor } from '#components'

const { data, refresh } = useFetch('/api/vehicleDrivers')

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const editor = useTemplateRef<typeof VehicleDriverEditor>('editor')

type Item = NonNullable<typeof data.value>[number]

function create() {
	if(!editor.value) return
	editor.value.create()
}

function edit(item: Item) {
	if(!editor.value) return
	editor.value.edit(item)
}

async function remove({ id }: Item) {
	if(await confirmDialogStore.askConfirm({
		title: 'Fahrberechtigung löschen?',
		text: 'Die Person darf danach keine dienstlichen Fahrzeuge mehr fahren.',
	})) {
		try {
			await $fetch(`/api/vehicleDrivers/${id}`, { method: 'DELETE' })
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
h1.kern-heading-large Fahrberechtigungen
p.kern-body
	| Vor der ersten Nutzung der dienstlichen Fahrzeuge ist die Fahrerlaubnis nachzuweisen und eine Unterweisung
	| durchzuführen und zu dokumentieren (§ 7 Abs. 2 Dienstreiserichtlinie). Fahren darf nur, wer beides vorweisen kann.
KernTable(
	caption="Liste der Fahrberechtigungen"
	:columns="[ 'person', 'license', 'instruction' ]"
	create-permission="vehicleDrivers.update"
	update-permission="vehicleDrivers.update"
	delete-permission="vehicleDrivers.update"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#person-header)
		| Person
	template(#person-body="{ item }")
		| {{ formatPerson(item.person) }}
		span.kern-body--small(v-if="!item.instructedAt")
			| &nbsp;· noch nicht berechtigt
	template(#license-header)
		| Fahrerlaubnis
	template(#license-body="{ item }")
		| Klasse {{ item.licenseClass }}, geprüft am {{ formatDate(item.licenseCheckedAt, 'compact') }} von {{ formatPerson(item.licenseCheckedBy) }}
	template(#instruction-header)
		| Unterweisung
	template(#instruction-body="{ item }")
		template(v-if="item.instructedAt")
			| am {{ formatDate(item.instructedAt, 'compact') }} durch {{ formatPerson(item.instructedBy) }}
		template(v-else)
			| –
VehicleDriverEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
