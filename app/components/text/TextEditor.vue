<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { DocumentType, OrganizationItem } from '~/types'

import { KernDialog } from '#components'

const props = defineProps<{
	organizationItem: string
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	type: DocumentType
	title: string
	text: string
	authorType: 'person' | 'organizationItem'
	authorOrganizationItem: OrganizationItem
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
			type: null,
			title: '',
			text: '',
			authorType: 'person',
			authorOrganizationItem: null,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/texts/${id}`)
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
			type: model.value.type?.id ?? null,
			title: model.value.title,
			text: model.value.text,
			authorType: model.value.authorType,
			authorOrganizationItem: model.value.authorOrganizationItem?.id ?? null,
		}
		if(itemId.value) {
			await $fetch(`/api/texts/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/texts', {
				method: 'POST',
				body: {
					organizationItem: props.organizationItem,
					...body,
				},
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
	:title="`Text ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		TextTypeInput(v-model="model.type")
		TextTitleInput(v-model="model.title")
		TextTextInput(v-model="model.text")
		TextAuthorInput(
			v-model:type="model.authorType"
			v-model:organization-item="model.authorOrganizationItem"
			:readonly="itemId !== null"
		)
</template>
