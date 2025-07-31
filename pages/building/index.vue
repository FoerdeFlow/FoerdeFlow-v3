<script setup lang="ts">
const authStore = useAuthStore()
const { data, refresh } = useFetch('/api/buildings')

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

const dialogItemId = ref<string | null>(null)
const dialogInputModel = reactive({
	code: '',
	name: '',
	postalAddress: '',
})
const dialogErrorMessage = ref<string | null>(null)

function create() {
	dialogItemId.value = null
	dialogInputModel.code = ''
	dialogInputModel.name = ''
	dialogInputModel.postalAddress = ''
	dialogErrorMessage.value = null
	dialog.value?.showModal()
}

async function edit(id: string) {
	dialogItemId.value = id
	dialogErrorMessage.value = null

	const item = await $fetch(`/api/buildings/${id}`)
	dialogInputModel.code = item.code
	dialogInputModel.name = item.name
	dialogInputModel.postalAddress = item.postalAddress
	dialog.value?.showModal()
}

function cancel() {
	dialog.value?.close()
}

async function save() {
	try {
		if(dialogItemId.value) {
			await $fetch(`/api/buildings/${dialogItemId.value}`, {
				method: 'PUT',
				body: dialogInputModel,
			})
		} else {
			await $fetch('/api/buildings', {
				method: 'POST',
				body: dialogInputModel,
			})
		}
		dialog.value?.close()
	} catch(e: any) {
		dialogErrorMessage.value = e?.data?.message || 'Ein unbekannter Fehler ist aufgetreten.'
	}
	await refresh()
}

function close() {
	dialog.value?.close()
}
</script>

<template lang="pug">
h1.kern-heading-large Gebäude
table.kern-table
	caption.kern-title Liste der Gebäude
	thead.kern-table__head
		tr.kern-table__row
			th.kern-table__header(
				scope="col"
			)
				| Nummer (Funktion)
				br
				em Anschrift
			th.kern-table__header(
				v-if="authStore.hasPermission('buildings.update') || authStore.hasPermission('buildings.delete')"
				scope="col"
			) Aktionen
	tbody.kern-table__body
		tr.kern-table__row(v-if="data?.length === 0")
			td.kern-table__cell(colspan="2") Keine Einträge gefunden.
		tr.kern-table__row(v-for="item of data")
			td.kern-table__cell
				| {{ item.code }} ({{ item.name }})
				br
				em {{ item.postalAddress }}
			td.kern-table__cell(
				v-if="authStore.hasPermission('buildings.update') || authStore.hasPermission('buildings.delete')"
			)
				button.kern-btn.kern-btn--tertiary(@click="edit(item.id)")
					span.kern-icon.kern-icon--edit(aria-hidden="true")
					span.kern-label.kern-sr-only Bearbeiten
button.my-4.kern-btn.kern-btn--primary(
	v-if="authStore.hasPermission('buildings.create')"
	@click="create()"
)
	span.kern-label Erstellen
dialog#dialog.kern-dialog(ref="dialog" aria-labelledby="dialog_heading")
	header.kern-dialog__header
		h2.kern-title.kern-title--large#dialog_heading Gebäude {{ dialogItemId ? 'bearbeiten' : 'erstellen' }}
		button.kern-btn.kern-btn--tertiary(@click="close()")
			span.kern-icon.kern-icon--close(aria-hidden="true")
			span.kern-sr-only Schließen
	section.kern-dialog__body
		.kern-alert.kern-alert--danger(v-if="dialogErrorMessage" role="alert")
			.kern-alert__header
				span.kern-icon.kern-icon--danger(aria-hidden="true")
				span.kern-title Fehler bei der {{ dialogItemId ? 'Bearbeitung' : 'Erstellung' }}
			.kern-alert__body
				p.kern-body {{ dialogErrorMessage }}
		.kern-form-input
			label.kern-label(for="code") Gebäudenummer
			input.kern-form-input__input#code(v-model="dialogInputModel.code" type="text")
		.kern-form-input
			label.kern-label(for="name") Funktion
			input.kern-form-input__input#name(v-model="dialogInputModel.name" type="text")
		.kern-form-input
			label.kern-label(for="postalAddress") Anschrift
			input.kern-form-input__input#postalAddress(v-model="dialogInputModel.postalAddress" type="text")
	footer.kern-dialog__footer
		button.kern-btn.kern-btn--secondary(@click="cancel()")
			span.kern-label Abbrechen
		button.kern-btn.kern-btn--primary(@click="save()")
			span.kern-label Speichern
</template>

<style lang="scss" scoped>
#dialog {
	width: 100%;
}

@media (min-width: 50rem) {
	#dialog {
		width: 50rem;
	}
}
</style>