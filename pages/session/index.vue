<script setup lang="ts">
import { FetchError } from 'ofetch'

const authStore = useAuthStore()
const { data, refresh } = useFetch('/api/sessions')
const { data: organizationItems } = useFetch('/api/organizationItems')
const { data: rooms } = useFetch('/api/rooms')

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

const dialogItemId = ref<string | null>(null)
const dialogInputModel = reactive({
	organizationItem: '',
	period: '',
	number: '',
	plannedDate: '',
	startDate: '',
	endDate: '',
	room: '',
})
const dialogErrorMessage = ref<string | null>(null)

function create() {
	dialogItemId.value = null
	dialogInputModel.organizationItem = ''
	dialogInputModel.period = ''
	dialogInputModel.number = ''
	dialogInputModel.plannedDate = ''
	dialogInputModel.startDate = ''
	dialogInputModel.endDate = ''
	dialogInputModel.room = ''
	dialogErrorMessage.value = null
	dialog.value?.showModal()
}

async function edit(id: string) {
	dialogItemId.value = id
	dialogErrorMessage.value = null

	const item = await $fetch(`/api/sessions/${id}`)
	dialogInputModel.organizationItem = item.organizationItem.id
	dialogInputModel.period = item.period.toString()
	dialogInputModel.number = item.number.toString()
	dialogInputModel.plannedDate = item.plannedDate
	dialogInputModel.startDate = item.startDate ?? ''
	dialogInputModel.endDate = item.endDate ?? ''
	dialogInputModel.room = item.room.id
	dialog.value?.showModal()
}

function cancel() {
	dialog.value?.close()
}

async function save() {
	try {
		const body = {
			organizationItem: dialogInputModel.organizationItem,
			period: parseInt(dialogInputModel.period, 10),
			number: parseInt(dialogInputModel.number, 10),
			plannedDate: dialogInputModel.plannedDate,
			...(dialogInputModel.startDate ? { startDate: dialogInputModel.startDate } : {}),
			...(dialogInputModel.endDate ? { endDate: dialogInputModel.endDate } : {}),
			room: dialogInputModel.room,
		}
		if(dialogItemId.value) {
			await $fetch(`/api/sessions/${dialogItemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/sessions', {
				method: 'POST',
				body,
			})
		}
		dialog.value?.close()
	} catch(e) {
		if(e instanceof FetchError) {
			dialogErrorMessage.value = e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.'
		}
	}
	await refresh()
}

function close() {
	dialog.value?.close()
}
</script>

<template lang="pug">
h1.kern-heading-large Sitzungen
table.kern-table
	caption.kern-title Liste der Sitzungen
	thead.kern-table__head
		tr.kern-table__row
			th.kern-table__header(
				scope="col"
			) Sitzung
			th.kern-table__header(
				scope="col"
			) Datum / Ort
			th.kern-table__header(
				scope="col"
			) Aktionen
	tbody.kern-table__body
		tr.kern-table__row(v-if="data?.length === 0")
			td.kern-table__cell(colspan="3") Keine Einträge gefunden.
		tr.kern-table__row(
			v-for="item of data"
			:key="item.id"
		)
			td.kern-table__cell {{ formatSessionNumber(item.period, item.number) }}
			td.kern-table__cell
				| {{ formatDatetime(item.plannedDate) }}
				br
				| {{ formatRoom(item.room) }}
			td.kern-table__cell(
				v-if="authStore.hasPermission('sessions.update') || authStore.hasPermission('sessions.delete')"
			)
				button.kern-btn.kern-btn--tertiary(@click="edit(item.id)")
					span.kern-icon.kern-icon--edit(aria-hidden="true")
					span.kern-label.kern-sr-only Bearbeiten
button.my-4.kern-btn.kern-btn--primary(
	v-if="authStore.hasPermission('sessions.create')"
	@click="create()"
)
	span.kern-label Erstellen
dialog#dialog.kern-dialog(
	ref="dialog"
	aria-labelledby="dialog_heading"
)
	header.kern-dialog__header
		h2.kern-title.kern-title--large#dialog_heading Sitzung {{ dialogItemId ? 'bearbeiten' : 'erstellen' }}
		button.kern-btn.kern-btn--tertiary(@click="close()")
			span.kern-icon.kern-icon--close(aria-hidden="true")
			span.kern-sr-only Schließen
	section.kern-dialog__body
		.kern-alert.kern-alert--danger(
			v-if="dialogErrorMessage"
			role="alert"
		)
			.kern-alert__header
				span.kern-icon.kern-icon--danger(aria-hidden="true")
				span.kern-title Fehler bei der {{ dialogItemId ? 'Bearbeitung' : 'Erstellung' }}
			.kern-alert__body
				p.kern-body {{ dialogErrorMessage }}
		.kern-form-input
			label.kern-label(for="organizationItem") Organisationseinheit
			select.kern-form-input__input#organizationItem(v-model="dialogInputModel.organizationItem")
				option(
					v-for="organizationItem of organizationItems"
					:key="organizationItem.id"
					:value="organizationItem.id"
				) {{ organizationItem.name }} ({{ organizationItem.code }})
		.kern-fieldset__body.kern-fieldset__body--horizontal
			.flex-1.kern-form-input
				label.kern-label(for="period") Periode
				input.kern-form-input__input#period(
					v-model="dialogInputModel.period"
					type="text"
					inputmode="numeric"
				)
			.flex-1.kern-form-input
				label.kern-label(for="number") Fortlaufende Nummer
				input.kern-form-input__input#number(
					v-model="dialogInputModel.number"
					type="text"
					inputmode="numeric"
				)
		p.kern-text(
			v-if="dialogInputModel.period > 1000 && dialogInputModel.number > 0"
		)
			b Sitzungsnummer:
			|
			| {{ formatSessionNumber(Number(dialogInputModel.period), Number(dialogInputModel.number)) }}
		.kern-form-input
			label.kern-label(for="plannedDate") Datum
			KernDateInput#plannedDate(
				v-model="dialogInputModel.plannedDate"
				show-time
			)
		.kern-form-input
			label.kern-label(for="startDate") Beginn der Sitzung #[span.kern-label__optional - Optional]
			KernDateInput#startDate(
				v-model="dialogInputModel.startDate"
				show-time
			)
		.kern-form-input
			label.kern-label(for="endDate") Ende der Sitzung #[span.kern-label__optional - Optional]
			KernDateInput#endDate(
				v-model="dialogInputModel.endDate"
				show-time
			)
		.kern-form-input
			label.kern-label(for="room") Raum
			select.kern-form-input__input#room(v-model="dialogInputModel.room")
				option(
					v-for="room of rooms"
					:key="room.id"
					:value="room.id"
				) {{ formatRoom(room) }}
	footer.kern-dialog__footer
		button.kern-btn.kern-btn--secondary(@click="cancel()")
			span.kern-label Abbrechen
		button.kern-btn.kern-btn--primary(@click="save()")
			span.kern-label Speichern
</template>

<style scoped>
#dialog {
	width: 100%;
}

@media (min-width: 50rem) {
	#dialog {
		width: 50rem;
	}
}
</style>
