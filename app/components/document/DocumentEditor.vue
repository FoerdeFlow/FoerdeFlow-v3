<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { KernDialog } from '#components'
import type { DocumentType, OrganizationItem, Person, Room } from '~/types'

const props = defineProps<{
	organizationItem: string
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	period: number | null
	number: number | null
	type: DocumentType
	authorType: 'organizationItem' | 'person' | null
	authorOrganizationItem: OrganizationItem
	authorPerson: Person
	title: string
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

async function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = structuredClone(data)
	model.value = null
	await nextTick()
	model.value = structuredClone(data)
	dialog.value.show()
}

defineExpose({
	async create() {
		await openDialog(null, {
			period: null,
			number: null,
			type: null,
			authorType: null,
			authorOrganizationItem: null,
			authorPerson: null,
			title: '',
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/documents/${id}`)
		await openDialog(id, {
			...item,
			authorType:
				item.authorOrganizationItem
					? 'organizationItem'
					: item.authorPerson
						? 'person'
						: null,
		})
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
			period: model.value.period,
			number: model.value.number,
			type: model.value.type?.id,
			authorOrganizationItem: model.value.authorOrganizationItem?.id ?? null,
			authorPerson: model.value.authorPerson?.id ?? null,
			title: model.value.title,
		}
		if(itemId.value) {
			await $fetch(`/api/documents/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/documents', {
				method: 'POST',
				body: {
					...body,
					organizationItem: props.organizationItem,
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
	:title="`Vorlage ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		DocumentQualifiedNumberInput(
			v-model:period="model.period"
			v-model:number="model.number"
		)
		DocumentTypeInput(v-model="model.type")
		DocumentAuthorInput(
			v-model:type="model.authorType"
			v-model:person="model.authorPerson"
			v-model:organization-item="model.authorOrganizationItem"
		)
		DocumentTitleInput(v-model="model.title")
</template>
