<script setup lang="ts">
const authStore = useAuthStore()
const { data, refresh } = useFetch('/api/persons')
const genders = [
	{ id: 'male', name: 'Männlich', code: 'M' },
	{ id: 'female', name: 'Weiblich', code: 'W' },
	{ id: 'non_binary', name: 'Nicht-binär', code: 'N' },
	{ id: 'diverse', name: 'Divers', code: 'D' },
]

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

const dialogItemId = ref<string | null>(null)
const dialogInputModel = reactive({
	firstName: '',
	lastName: '',
	callName: '',
	gender: '',
	pronouns: '',
	email: '',
})
const dialogErrorMessage = ref<string | null>(null)

function create() {
	dialogItemId.value = null
	dialogInputModel.firstName = ''
	dialogInputModel.lastName = ''
	dialogInputModel.callName = ''
	dialogInputModel.gender = ''
	dialogInputModel.pronouns = ''
	dialogInputModel.email = ''
	dialogErrorMessage.value = null
	dialog.value?.showModal()
}

async function edit(id: string) {
	dialogItemId.value = id
	dialogErrorMessage.value = null

	const item = await $fetch(`/api/persons/${id}`)
	dialogInputModel.email = item.email
	dialogInputModel.firstName = item.firstName
	dialogInputModel.lastName = item.lastName
	dialogInputModel.callName = item.callName || ''
	dialogInputModel.gender = item.gender || ''
	dialogInputModel.pronouns = item.pronouns || ''
	dialog.value?.showModal()
}

function cancel() {
	dialog.value?.close()
}

async function save() {
	try {
		if(dialogItemId.value) {
			await $fetch(`/api/persons/${dialogItemId.value}`, {
				method: 'PUT',
				body: dialogInputModel,
			})
		} else {
			await $fetch('/api/persons', {
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
h1.kern-heading-large Personen
table.kern-table
	caption.kern-title Liste der Personen
	thead.kern-table__head
		tr.kern-table__row
			th.kern-table__header(
				scope="col"
			) Name (Pronomen)
			th.kern-table__header(
				scope="col"
			) E-Mail-Adresse
			th.kern-table__header(
				v-if="authStore.hasPermission('persons.update') || authStore.hasPermission('persons.delete')"
				scope="col"
			) Aktionen
	tbody.kern-table__body
		tr.kern-table__row(v-if="data?.length === 0")
			td.kern-table__cell(colspan="2") Keine Einträge gefunden.
		tr.kern-table__row(v-for="item of data")
			td.kern-table__cell {{ item.firstName }} {{ item.callName ? `"${item.callName}"` : '' }} {{ item.lastName }} ({{ item.pronouns }})
			td.kern-table__cell {{ item.email }}
			td.kern-table__cell(
				v-if="authStore.hasPermission('persons.update') || authStore.hasPermission('persons.delete')"
			)
				button.kern-btn.kern-btn--tertiary(@click="edit(item.id)")
					span.kern-icon.kern-icon--edit(aria-hidden="true")
					span.kern-label.kern-sr-only Bearbeiten
button.my-4.kern-btn.kern-btn--primary(
	v-if="authStore.hasPermission('persons.create')"
	@click="create()"
)
	span.kern-label Erstellen
dialog#dialog.kern-dialog(ref="dialog" aria-labelledby="dialog_heading")
	header.kern-dialog__header
		h2.kern-title.kern-title--large#dialog_heading Person {{ dialogItemId ? 'bearbeiten' : 'erstellen' }}
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
		.kern-container-fluid
			.kern-row
				.kern-col.kern-form-input
					label.kern-label(for="firstName") Vorname
					input.kern-form-input__input#firstName(v-model="dialogInputModel.firstName" type="text")
				.kern-col.kern-form-input
					label.kern-label(for="lastName") Nachname
					input.kern-form-input__input#lastName(v-model="dialogInputModel.lastName" type="text")
			.kern-row
				.kern-col.kern-form-input
					label.kern-label(for="callName") Selbstgewählter Name #[span.kern-label__optional - Optional]
					input.kern-form-input__input#callName(v-model="dialogInputModel.callName" type="text")
			.kern-row
				.kern-col.kern-form-input
					label.kern-label(for="gender") Geschlecht #[span.kern-label__optional - Optional]
					select.kern-form-input__input#gender(v-model="dialogInputModel.gender")
						option(v-for="item of genders" :value="item.id") {{ item.name }} ({{ item.code }})
				.kern-col.kern-form-input
					label.kern-label(for="pronouns") Pronomen #[span.kern-label__optional - Optional]
					input.kern-form-input__input#pronouns(v-model="dialogInputModel.pronouns" type="text")
			.kern-row
				.kern-col.kern-form-input
					label.kern-label(for="email") E-Mail-Adresse
					input.kern-form-input__input#email(v-model="dialogInputModel.email" type="email" autocomplete="email")
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

@media (min-width: 60rem) {
	#dialog {
		width: 60rem;
	}
}
</style>