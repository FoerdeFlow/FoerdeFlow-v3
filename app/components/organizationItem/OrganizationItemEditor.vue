<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'
import type { OrganizationItem, OrganizationType } from '~/types'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	parent: OrganizationItem
	organizationType: OrganizationType
	code: string
	name: string
	description: string
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = structuredClone(data)
	model.value = structuredClone(data)
	dialog.value.show()
}

defineExpose({
	create() {
		openDialog(null, {
			parent: null,
			organizationType: null,
			code: '',
			name: '',
			description: '',
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/organizationItems/${id}`)
		openDialog(id, item)
	},
})

const emit = defineEmits<{
	refresh: []
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

async function save() {
	if(!dialog.value || !model.value) return
	try {
		const body = {
			parent: model.value.parent?.id ?? null,
			organizationType: model.value.organizationType?.id ?? null,
			code: model.value.code,
			name: model.value.name,
			description: model.value.description,
		}
		if(itemId.value) {
			await $fetch(`/api/organizationItems/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/organizationItems', {
				method: 'POST',
				body,
			})
		}
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: `Fehler bei der ${itemId.value ? 'Bearbeitung' : 'Erstellung'}`,
				text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="`Organisationseinheit ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		OrganizationItemParentInput(v-model="model.parent")
		OrganizationItemOrganizationTypeInput(v-model="model.organizationType")
		OrganizationItemCodeInput(v-model="model.code")
		OrganizationItemNameInput(v-model="model.name")
		OrganizationItemDescriptionInput(v-model="model.description")
</template>
