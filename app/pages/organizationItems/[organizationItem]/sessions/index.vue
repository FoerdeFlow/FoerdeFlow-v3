<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { SessionEditor } from '#components'

const route = useRoute('organizationItems-organizationItem-sessions')
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()

const { data, refresh } = useFetch('/api/sessions', {
	query: { organizationItem: route.params.organizationItem },
})

const dialog = useTemplateRef<typeof SessionEditor>('dialog')

function create() {
	if(!dialog.value) return
	dialog.value.create()
}

function edit({ id }: { id: string }) {
	if(!dialog.value) return
	dialog.value.edit(id)
}

async function remove({ id }: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: 'Sitzung löschen?',
		text: 'Sind Sie sicher, dass Sie diese Sitzung löschen möchten?',
	})) {
		try {
			await $fetch(`/api/sessions/${id}`, { method: 'DELETE' })
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
aside
	NuxtLink.kern-link(
		:to="{ name: 'organizationItems-organizationItem', params: { organizationItem: route.params.organizationItem } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zum Gremium
h1.kern-heading-large Sitzungen
KernTable(
	caption="Liste der Sitzungen"
	create-permission="sessions.create"
	update-permission="sessions.update"
	delete-permission="sessions.delete"
	show-actions
	:columns="['qualifiedNumber', 'timeAndLocation']"
	:data="data || []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#qualifiedNumber-header)
		| Sitzung
	template(#qualifiedNumber-body="{ item }")
		| {{ formatSessionNumber(item.period, item.number) }}
	template(#timeAndLocation-header)
		| Datum / Ort
	template(#timeAndLocation-body="{ item }")
		| {{ formatDatetime(item.plannedDate) }}
		br
		| {{ formatRoom(item.room) }}
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to="{ name: 'organizationItems-organizationItem-sessions-session', params: { organizationItem: route.params.organizationItem, session: item.id } }"
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
SessionEditor(
	ref="dialog"
	:organization-item="route.params.organizationItem"
	@refresh="refresh"
)
</template>
