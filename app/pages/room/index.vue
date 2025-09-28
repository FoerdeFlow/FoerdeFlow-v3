<script setup lang="ts">
import { FetchError } from 'ofetch'

const authStore = useAuthStore()
const { data, refresh } = useFetch('/api/rooms')
const { data: buildings } = useFetch('/api/buildings')

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

const dialogItemId = ref<string | null>(null)
const dialogInputModel = reactive({
	building: '',
	level: '',
	code: '',
	name: '',
	capacity: '',
})
const dialogErrorMessage = ref<string | null>(null)

function create() {
	dialogItemId.value = null
	dialogInputModel.building = ''
	dialogInputModel.level = ''
	dialogInputModel.code = ''
	dialogInputModel.name = ''
	dialogInputModel.capacity = ''
	dialogErrorMessage.value = null
	dialog.value?.showModal()
}

async function edit(id: string) {
	dialogItemId.value = id
	dialogErrorMessage.value = null

	const item = await $fetch(`/api/rooms/${id}`)
	dialogInputModel.building = item.building.id
	dialogInputModel.level = item.level.toString()
	dialogInputModel.code = item.code
	dialogInputModel.name = item.name
	dialogInputModel.capacity = item.capacity.toString()
	dialog.value?.showModal()
}

function cancel() {
	dialog.value?.close()
}

async function save() {
	try {
		const body = {
			building: dialogInputModel.building,
			level: parseInt(dialogInputModel.level, 10),
			code: dialogInputModel.code,
			name: dialogInputModel.name,
			capacity: parseInt(dialogInputModel.capacity, 10),
		}
		if(dialogItemId.value) {
			await $fetch(`/api/rooms/${dialogItemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/rooms', {
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
h1.kern-heading-large Räume
table.kern-table
	caption.kern-title Liste der Räume
	thead.kern-table__head
		tr.kern-table__row
			th.kern-table__header(
				scope="col"
			) Raumnummer (Funktion)
			th.kern-table__header(
				v-if="authStore.hasPermission('rooms.update') || authStore.hasPermission('rooms.delete')"
				scope="col"
			) Aktionen
	tbody.kern-table__body
		tr.kern-table__row(v-if="data?.length === 0")
			td.kern-table__cell(colspan="2") Keine Einträge gefunden.
		tr.kern-table__row(
			v-for="item of data"
			:key="item.id"
		)
			td.kern-table__cell {{ formatRoom(item) }}
			td.kern-table__cell(
				v-if="authStore.hasPermission('rooms.update') || authStore.hasPermission('rooms.delete')"
			)
				button.kern-btn.kern-btn--tertiary(@click="edit(item.id)")
					span.kern-icon.kern-icon--edit(aria-hidden="true")
					span.kern-label.kern-sr-only Bearbeiten
button.my-4.kern-btn.kern-btn--primary(
	v-if="authStore.hasPermission('rooms.create')"
	@click="create()"
)
	span.kern-label Erstellen
dialog#dialog.kern-dialog(
	ref="dialog"
	aria-labelledby="dialog_heading"
)
	header.kern-dialog__header
		h2.kern-title.kern-title--large#dialog_heading Raum {{ dialogItemId ? 'bearbeiten' : 'erstellen' }}
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
			label.kern-label(for="building") Gebäude
			select.kern-form-input__select#building(v-model="dialogInputModel.building")
				option(
					v-for="building of buildings"
					:key="building.id"
					:value="building.id"
				) {{ building.code }} ({{ building.name }})
		.kern-form-input
			label.kern-label(for="level") Stockwerk
			input.kern-form-input__input#level(
				v-model="dialogInputModel.level"
				type="text"
				inputmode="numeric"
			)
		.kern-form-input
			label.kern-label(for="code") Raumnummer
			input.kern-form-input__input#code(
				v-model="dialogInputModel.code"
				type="text"
			)
		.kern-form-input
			label.kern-label(for="name") Funktion
			input.kern-form-input__input#name(
				v-model="dialogInputModel.name"
				type="text"
			)
		.kern-form-input
			label.kern-label(for="capacity") Raumkapazität
			input.kern-form-input__input#capacity(
				v-model="dialogInputModel.capacity"
				type="text"
				inputmode="numeric"
			)
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
