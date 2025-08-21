<script setup lang="ts">
import { KernDialog } from '#components'
import { FetchError } from 'ofetch'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

type Model = {
	code: string
	name: string
	postalAddress: string
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
			code: '',
			name: '',
			postalAddress: '',
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/buildings/${id}`)
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
	if(!dialog.value) return
	try {
		if(itemId.value) {
			await $fetch(`/api/buildings/${itemId.value}`, {
				method: 'PUT',
				body: model.value,
			})
		} else {
			await $fetch('/api/buildings', {
				method: 'POST',
				body: model.value,
			})
		}
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: `Fehler bei der ${itemId.value ? 'Bearbeitung' : 'Erstellung'}`,
				text: e.data?.message || 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	}
}

function close() {
	if(!dialog.value) return
	dialog.value.close()
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="`Gebäude ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		BuildingCodeInput(v-model="model.code")
		BuildingNameInput(v-model="model.name")
		BuildingPostalAddress(v-model="model.postalAddress")
</template>
