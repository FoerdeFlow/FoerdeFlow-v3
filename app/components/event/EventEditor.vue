<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { EventType, Location } from '~/types'

import { KernDialog } from '#components'

const props = defineProps<{
	organizationItem: string
}>()

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	title: string
	description: string | null
	type: EventType
	allDay: boolean
	startDate: Date | null
	endDate: Date | null
	location: Location
	onlineLocation: Location
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
	// Die Datumsfelder erst im nächsten Tick füllen, damit KernDateInput nicht
	// die Werte des zuvor bearbeiteten Termins weiterschreibt.
	model.value = null
	await nextTick()
	model.value = structuredClone(data)
	dialog.value.show()
}

defineExpose({
	async create() {
		await openDialog(null, {
			title: '',
			description: null,
			type: null,
			allDay: false,
			startDate: null,
			endDate: null,
			location: null,
			onlineLocation: null,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/events/${id}`)
		await openDialog(id, {
			title: item.title,
			description: item.description,
			type: item.type,
			allDay: item.allDay,
			startDate: item.startDate ? new Date(item.startDate) : null,
			endDate: item.endDate ? new Date(item.endDate) : null,
			location: item.location,
			onlineLocation: item.onlineLocation,
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

// Ein Termin braucht mindestens einen Titel, eine Art und einen Beginn. Der Ort
// darf offen bleiben, solange er noch nicht feststeht.
const valid = computed(() => Boolean(
	model.value?.title && model.value.type && model.value.startDate,
))

async function save() {
	if(!dialog.value || !model.value) return
	try {
		const body = {
			title: model.value.title,
			description: model.value.description,
			type: model.value.type?.id ?? null,
			allDay: model.value.allDay,
			startDate: model.value.startDate?.toISOString() ?? null,
			endDate: model.value.endDate?.toISOString() ?? null,
			location: model.value.location?.id ?? null,
			onlineLocation: model.value.onlineLocation?.id ?? null,
		}
		if(itemId.value) {
			await $fetch(`/api/events/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/events', {
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
				title: itemId.value
					? t('event.edit.error.title')
					: t('event.create.error.title'),
				text: e.data?.message ?? (itemId.value
					? t('event.edit.error.message')
					: t('event.create.error.message')
				),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('event.edit.title') : $t('event.create.title')"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		EventTitleInput(v-model="model.title")
		EventTypeInput(v-model="model.type")
		EventDescriptionInput(v-model="model.description")
		EventAllDayInput(v-model="model.allDay")
		.kern-fieldset__body.kern-fieldset__body--horizontal
			EventStartDateInput.flex-1(
				v-model="model.startDate"
				:all-day="model.allDay"
			)
			EventEndDateInput.flex-1(
				v-model="model.endDate"
				:all-day="model.allDay"
			)
		EventLocationInput(
			v-model="model.location"
			:organization-item="props.organizationItem"
		)
		EventOnlineLocationInput(
			v-model="model.onlineLocation"
			:organization-item="props.organizationItem"
		)
</template>
