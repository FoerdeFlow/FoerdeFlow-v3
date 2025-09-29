<script setup lang="ts">
import { useRoute } from 'vue-router'
import { FetchError } from 'ofetch'
import type { AttendanceEditor } from '#components'

const route = useRoute('organizationItems-organizationItem-sessions-session-attendances')

const editor = useTemplateRef<typeof AttendanceEditor>('editor')

const authStore = useAuthStore()
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()

const { data, refresh } = useFetch('/api/attendances', {
	params: {
		session: route.params.session,
	},
})

function create() {
	if(!editor.value) return
	editor.value.create()
}

function edit({ id, person }: { id: string | null, person: { id: string } }) {
	if(!editor.value) return
	if(!id) {
		editor.value.create({
			person,
		})
		return
	}
	editor.value.edit(id)
}

async function remove({ id }: { id: string | null }) {
	if(!editor.value) return
	if(!id) return

	if(await confirmDialogStore.askConfirm({
		title: 'Anwesenheitsstatus zurücksetzen?',
		text: 'Sind Sie sicher, dass Sie diese Anwesenheit löschen möchten?',
	})) {
		try {
			await $fetch(`/api/attendances/${id}`, { method: 'DELETE' })
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

function downloadAsPdf() {
	open(`/api/attendances/pdf?session=${route.params.session}`)
}
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'organizationItems-organizationItem-sessions-session', params: { organizationItem: route.params.organizationItem, session: route.params.session } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Sitzung
template(v-if="data")
	header
		h1.kern-heading-large
			| Anwesenheitsliste zur
			| {{ data.session.organizationItem.code }}-Sitzung
			| {{ formatSessionNumber(data.session.period, data.session.number) }}
	.mb-8
		button.kern-btn.kern-btn--secondary(
			@click="downloadAsPdf"
		)
			span.kern-icon.kern-icon--download(aria-hidden="true")
			span.kern-label Als PDF exportieren
	.mb-8(
		v-for="group of data.groups"
		:key="group.id"
	)
		KernTable(
			:caption="`Anwesenheitsliste für ${group.name}`"
			:create-permission="null"
			update-permission="attendances.update"
			:delete-permission="null"
			:columns="[ { name: 'name' }, { name: 'status', width: '12em' } ]"
			:data="group.members"
			@create="create"
			@edit="edit"
			@remove="remove"
		)
			template(#name-header)
				| Name
			template(#name-body="{ item }")
				| {{ formatPerson(item.person) }}
			template(#status-header)
				| Status
			template(#status-body="{ item }")
				AttendanceStatusBadge(:status="item.status")
			template(#actions="{ item }")
				button.kern-btn.kern-btn--tertiary(
					v-if="authStore.hasPermission('attendances.delete').value && item.id"
					@click="remove(item)"
				)
					span.kern-icon.kern-icon--close(aria-hidden="true")
					span.kern-label.kern-sr-only Zurücksetzen
	.mb-8
		KernTable(
			caption="Anwesenheitsliste für Gäste"
			create-permission="attendances.create"
			update-permission="attendances.update"
			delete-permission="attendances.delete"
			:columns="[ { name: 'name' }, { name: 'status', width: '12em' } ]"
			:data="data.guests"
			@create="create"
			@edit="edit"
			@remove="remove"
		)
			template(#name-header)
				| Name
			template(#name-body="{ item }")
				| {{ formatPerson(item.person) }}
			template(#status-header)
				| Status
			template(#status-body="{ item }")
				AttendanceStatusBadge(:status="item.status")
AttendanceEditor(
	ref="editor"
	:session="route.params.session"
	@refresh="refresh"
)
</template>
