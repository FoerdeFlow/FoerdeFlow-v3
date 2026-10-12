<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { Person } from '~/types'

import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	person: Person
	licenseClass: string | null
	licenseCheckedAt: Date | null
	licenseCheckedBy: Person
	instructedAt: Date | null
	instructedBy: Person
}
const itemModel = ref<string | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => !!model.value && itemModel.value !== JSON.stringify(model.value))

const valid = computed(() => !!model.value?.person && !!model.value.licenseClass &&
	!!model.value.licenseCheckedAt && !!model.value.licenseCheckedBy &&
	!model.value.instructedAt === !model.value.instructedBy)

function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = JSON.stringify(data)
	model.value = data
	dialog.value.show()
}

interface Item {
	id: string
	person: Person
	licenseClass: string
	licenseCheckedAt: string
	licenseCheckedBy: Person
	instructedAt: string | null
	instructedBy: Person
}

defineExpose({
	create() {
		openDialog(null, {
			person: null,
			licenseClass: 'B',
			licenseCheckedAt: null,
			licenseCheckedBy: null,
			instructedAt: null,
			instructedBy: null,
		})
	},
	edit(item: Item) {
		openDialog(item.id, {
			person: item.person,
			licenseClass: item.licenseClass,
			licenseCheckedAt: new Date(item.licenseCheckedAt),
			licenseCheckedBy: item.licenseCheckedBy,
			instructedAt: item.instructedAt ? new Date(item.instructedAt) : null,
			instructedBy: item.instructedBy,
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
	const body = {
		licenseClass: model.value.licenseClass,
		licenseCheckedAt: serializeDate(model.value.licenseCheckedAt),
		licenseCheckedBy: model.value.licenseCheckedBy?.id ?? null,
		instructedAt: serializeDate(model.value.instructedAt),
		instructedBy: model.value.instructedAt ? model.value.instructedBy?.id ?? null : null,
	}
	try {
		if(itemId.value) {
			await $fetch(`/api/vehicleDrivers/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/vehicleDrivers', {
				method: 'POST',
				body: { ...body, person: model.value.person?.id ?? null },
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

const personId = useId()
const checkedById = useId()
const instructedById = useId()
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="`Fahrberechtigung ${itemId ? 'bearbeiten' : 'erfassen'}`"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		.kern-form-input
			label.kern-label(:for="personId") Person
			PersonSelect(
				:id="personId"
				v-model="model.person"
				:readonly="!!itemId"
			)
		TravelTextInput(
			v-model="model.licenseClass"
			label="Führerscheinklasse"
			:max-length="16"
		)
		TravelDateInput(
			v-model="model.licenseCheckedAt"
			label="Fahrerlaubnis geprüft am"
		)
		.kern-form-input
			label.kern-label(:for="checkedById") Geprüft von
			PersonSelect(
				:id="checkedById"
				v-model="model.licenseCheckedBy"
			)
		TravelDateInput(
			v-model="model.instructedAt"
			label="Unterwiesen am"
		)
		.kern-form-input(v-if="model.instructedAt")
			label.kern-label(:for="instructedById") Unterwiesen durch
			PersonSelect(
				:id="instructedById"
				v-model="model.instructedBy"
			)
</template>
