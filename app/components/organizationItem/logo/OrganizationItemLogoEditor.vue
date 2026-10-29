<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { KernDialog } from '#components'

const itemId = ref<string | null>(null)
const hasLogo = ref(false)
const model = ref<File | null>(null)
const dialog = useTemplateRef<typeof KernDialog>('dialog')

defineExpose({
	async edit(id: string, logo: boolean) {
		if(!dialog.value) return
		itemId.value = id
		hasLogo.value = logo
		model.value = null
		await nextTick()
		dialog.value.show()
	},
})

const emit = defineEmits<{
	refresh: [],
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

function showError(e: unknown) {
	if(!dialog.value) return
	if(e instanceof FetchError) {
		dialog.value.showAlert({
			type: 'danger',
			title: 'Fehler bei der Bearbeitung',
			text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
		})
	}
}

async function save() {
	if(!dialog.value) return
	if(!model.value) {
		dialog.value.hide()
		return
	}
	try {
		await $fetch(`/api/organizationItems/${itemId.value}/logo`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/octet-stream',
			},
			body: model.value,
		})
		emit('refresh')
		dialog.value.hide()
		itemId.value = null
	} catch(e: unknown) {
		showError(e)
	}
}

async function unlinkFile() {
	if(!dialog.value) return
	try {
		await $fetch(`/api/organizationItems/${itemId.value}/logo`, {
			method: 'DELETE',
		})
		emit('refresh')
		dialog.value.hide()
		itemId.value = null
	} catch(e: unknown) {
		showError(e)
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	title="Logo bearbeiten"
	:modal="true"
	@cancel="cancel"
	@save="save"
)
	template(v-if="itemId")
		p.kern-body
			| Das Logo erscheint auf allen PDF-Dokumenten dieser Organisationseinheit
			| und der ihr untergeordneten Einheiten, die kein eigenes Logo haben.
		OrganizationItemLogoInput(
			v-model="model"
		)
		button.kern-btn.kern-btn--secondary(
			v-if="hasLogo"
			@click="unlinkFile"
		)
			span.kern-icon.kern-icon--delete(aria-hidden="true")
			span.kern-label Logo entfernen
</template>
