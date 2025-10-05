<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { KernDialog } from '#components'
import type { Room } from '~/types'

const props = defineProps<{
	organizationItem: string
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	period: number | null
	number: number | null
	plannedDate: Date | null
	startDate: Date | null
	endDate: Date | null
	room: Room
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
			plannedDate: null,
			startDate: null,
			endDate: null,
			room: null,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/sessions/${id}`)
		await openDialog(id, {
			period: item.period,
			number: item.number,
			plannedDate: item.plannedDate ? new Date(item.plannedDate) : null,
			startDate: item.startDate ? new Date(item.startDate) : null,
			endDate: item.endDate ? new Date(item.endDate) : null,
			room: item.room,
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
	if(!dialog.value) return
	try {
		const body = {
			period: model.value?.period,
			number: model.value?.number,
			plannedDate: model.value?.plannedDate ? model.value.plannedDate.toISOString() : null,
			startDate: model.value?.startDate ? model.value.startDate.toISOString() : null,
			endDate: model.value?.endDate ? model.value.endDate.toISOString() : null,
			room: model.value?.room?.id ?? null,
		}
		if(itemId.value) {
			await $fetch(`/api/sessions/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/sessions', {
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
	:title="`Sitzung ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		SessionQualifiedNumberInput(
			v-model:period="model.period"
			v-model:number="model.number"
		)
		SessionPlannedDateInput(v-model="model.plannedDate")
		SessionStartDateInput(v-model="model.startDate")
		SessionEndDateInput(v-model="model.endDate")
		SessionRoomInput(v-model="model.room")
</template>
