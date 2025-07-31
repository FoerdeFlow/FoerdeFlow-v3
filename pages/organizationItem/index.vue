<script setup lang="ts">
const authStore = useAuthStore()
const { data, refresh } = useFetch('/api/organizationItems')
const { data: organizationTypes } = useFetch('/api/organizationTypes')

const flattenTree = (tree: any[], prefix = ''): any[] => tree.flatMap(item => ([
	{
		...item,
		displayName: `${prefix}${item.name} (${item.code})`,
	},
	...flattenTree(item.children, `${prefix}— `),
]))
const organizationItems = computed(() => data.value ? flattenTree(data.value) : [])

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

const dialogItemId = ref<string | null>(null)
const dialogInputModel = reactive({
	parent: '',
	organizationType: '',
	code: '',
	name: '',
})
const dialogErrorMessage = ref<string | null>(null)

function create() {
	dialogItemId.value = null
	dialogInputModel.parent = ''
	dialogInputModel.organizationType = ''
	dialogInputModel.code = ''
	dialogInputModel.name = ''
	dialogErrorMessage.value = null
	dialog.value?.showModal()
}

async function edit(id: string) {
	dialogItemId.value = id
	dialogErrorMessage.value = null

	const item = await $fetch(`/api/organizationItems/${id}`)
	dialogInputModel.parent = item.parent || ''
	dialogInputModel.organizationType = item.organizationType
	dialogInputModel.code = item.code
	dialogInputModel.name = item.name
	dialog.value?.showModal()
}

function cancel() {
	dialog.value?.close()
}

async function save() {
	try {
		const model = {
			...dialogInputModel,
			parent: dialogInputModel.parent || null,
		}
		if(dialogItemId.value) {
			await $fetch(`/api/organizationItems/${dialogItemId.value}`, {
				method: 'PUT',
				body: model,
			})
		} else {
			await $fetch('/api/organizationItems', {
				method: 'POST',
				body: model,
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
h1.kern-heading-large Organisationseinheiten
table.kern-table
	caption.kern-title Liste der Organisationseinheiten
	thead.kern-table__head
		tr.kern-table__row
			th.kern-table__header(
				scope="col"
			)
				em OE-Kategorie
				br
				| Name (Kürzel)
			th.kern-table__header(
				v-if="authStore.hasPermission('organizationItems.update') || authStore.hasPermission('organizationItems.delete')"
				scope="col"
			) Aktionen
	tbody.kern-table__body
		tr.kern-table__row(v-if="data?.length === 0")
			td.kern-table__cell(colspan="2") Keine Einträge gefunden.
		tr.kern-table__row(v-for="item of organizationItems" :key="item.id")
			td.kern-table__cell
				em {{ item.organizationType.name }} ({{ item.organizationType.code }})
				br
				| {{ item.displayName }}
			td.kern-table__cell(
				v-if="authStore.hasPermission('organizationItems.update') || authStore.hasPermission('organizationItems.delete')"
			)
				button.kern-btn.kern-btn--tertiary(@click="edit(item.id)")
					span.kern-icon.kern-icon--edit(aria-hidden="true")
					span.kern-label.kern-sr-only Bearbeiten
				button.kern-btn.kern-btn--tertiary(@click="$router.push(`/organizationItem/${item.id}`)")
					span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
					span.kern-label.kern-sr-only Aufrufen
button.my-4.kern-btn.kern-btn--primary(
	v-if="authStore.hasPermission('organizationItems.create')"
	@click="create()"
)
	span.kern-label Erstellen
dialog#dialog.kern-dialog(ref="dialog" aria-labelledby="dialog_heading")
	header.kern-dialog__header
		h2.kern-title.kern-title--large#dialog_heading Organisationseinheit {{ dialogItemId ? 'bearbeiten' : 'erstellen' }}
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
			label.kern-label(for="parent") Übergeordnete Organisationseinheit #[span.kern-label__optional - Optional]
			select.kern-form-input__input#parent(v-model="dialogInputModel.parent")
				option(value="") - Keine -
				option(v-for="item of organizationItems" :value="item.id") {{ item.displayName }}
		.kern-form-input
			label.kern-label(for="organizationType") OE-Kategorie
			select.kern-form-input__input#organizationType(v-model="dialogInputModel.organizationType")
				option(v-for="item of organizationTypes" :value="item.id") {{ item.name }} ({{ item.code }})
		.kern-form-input
			label.kern-label(for="code") Kürzel
			input.kern-form-input__input#code(v-model="dialogInputModel.code" type="text")
		.kern-form-input
			label.kern-label(for="name") Name
			input.kern-form-input__input#name(v-model="dialogInputModel.name" type="text")
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