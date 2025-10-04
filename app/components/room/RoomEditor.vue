<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'
import type { Building } from '~/types'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	building: Building
	level: number
	code: string
	name: string
	capacity: number
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
			building: null,
			level: 0,
			code: '',
			name: '',
			capacity: 0,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/rooms/${id}`)
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
			building: model.value.building?.id ?? null,
			level: model.value.level,
			code: model.value.code,
			name: model.value.name,
			capacity: model.value.capacity,
		}
		if(itemId.value) {
			await $fetch(`/api/rooms/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/rooms', {
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
	:title="`Raum ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		RoomBuildingInput(v-model="model.building")
		RoomLevelInput(v-model="model.level")
		RoomCodeInput(v-model="model.code")
		RoomNameInput(v-model="model.name")
		RoomCapacityInput(v-model="model.capacity")
</template>
