<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { LocationType } from '~/types'

import { KernDialog } from '#components'

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	type: LocationType
	parent: string | null
	// Nur ein Ad-hoc-Ort trägt ein Gremium, und nur bis er überführt ist.
	organizationItem: string | null
	code: string
	name: string
	level: number
	capacity: number | null
	postalAddress: string
	url: string
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
	itemModel.value = structuredClone(toRaw(data))
	model.value = structuredClone(toRaw(data))
	dialog.value.show()
}

defineExpose({
	create() {
		openDialog(null, {
			type: 'building',
			parent: null,
			organizationItem: null,
			code: '',
			name: '',
			level: 0,
			capacity: null,
			postalAddress: '',
			url: '',
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/locations/${id}`)
		openDialog(id, {
			type: item.type,
			parent: item.parent?.id ?? null,
			organizationItem: item.organizationItem,
			code: item.code ?? '',
			name: item.name,
			level: item.level ?? 0,
			capacity: item.capacity,
			postalAddress: item.postalAddress ?? '',
			url: item.url ?? '',
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

const valid = computed(() => {
	const value = model.value
	if(!value?.name) return false
	switch(value.type) {
		case 'room': return Boolean(value.parent)
		case 'online': return Boolean(value.url)
		case 'adHoc': return true
		default: return Boolean(value.postalAddress)
	}
})

// Jede Ortsart trägt nur die Felder, die zu ihr gehören. Der Rest fällt weg,
// damit das Überführen eines Ad-hoc-Ortes nichts Altes stehen lässt.
function toBody(value: Model) {
	switch(value.type) {
		case 'building':
			return {
				type: value.type,
				code: value.code,
				name: value.name,
				postalAddress: value.postalAddress,
			}
		case 'room':
			return {
				type: value.type,
				parent: value.parent,
				code: value.code,
				name: value.name,
				level: value.level,
				capacity: value.capacity,
			}
		case 'online':
			return {
				type: value.type,
				code: value.code,
				name: value.name,
				url: value.url,
			}
		case 'adHoc':
			return {
				type: value.type,
				organizationItem: value.organizationItem,
				name: value.name,
				postalAddress: value.postalAddress,
				url: value.url,
			}
		default:
			return {
				type: value.type,
				code: value.code,
				name: value.name,
				postalAddress: value.postalAddress,
				capacity: value.capacity,
			}
	}
}

async function save() {
	if(!dialog.value || !model.value) return
	try {
		const body = toBody(model.value)
		if(itemId.value) {
			await $fetch(`/api/locations/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/locations', {
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
				title: itemId.value
					? t('location.edit.error.title')
					: t('location.create.error.title'),
				text: e.data?.message ?? (itemId.value
					? t('location.edit.error.message')
					: t('location.create.error.message')
				),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('location.edit.title') : $t('location.create.title')"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		LocationTypeInput(v-model="model.type")
		LocationParentInput(
			v-if="model.type === 'room'"
			v-model="model.parent"
		)
		LocationCodeInput(
			v-if="model.type !== 'adHoc'"
			v-model="model.code"
		)
		LocationNameInput(v-model="model.name")
		LocationLevelInput(
			v-if="model.type === 'room'"
			v-model="model.level"
		)
		LocationPostalAddressInput(
			v-if="[ 'building', 'place', 'external', 'adHoc' ].includes(model.type)"
			v-model="model.postalAddress"
		)
		LocationUrlInput(
			v-if="[ 'online', 'adHoc' ].includes(model.type)"
			v-model="model.url"
		)
		LocationCapacityInput(
			v-if="[ 'room', 'place', 'external' ].includes(model.type)"
			v-model="model.capacity"
		)
</template>
