<script setup lang="ts">
import { FetchError } from 'ofetch'

import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	transportModes: string[]
	code: string
	name: string
	roles: string[]
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => !!itemModel.value && !!model.value &&
	JSON.stringify(itemModel.value) !== JSON.stringify(model.value))

// A reason is only ever given for a means of transport, so it needs one.
const valid = computed(() => !!model.value && model.value.code.trim() !== '' &&
	model.value.name.trim() !== '' && model.value.transportModes.length > 0)

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
			transportModes: [],
			code: '',
			name: '',
			roles: [],
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/travelTransportReasons/${id}`)
		openDialog(id, {
			code: item.code,
			name: item.name,
			transportModes: item.transportModes.map((transportMode) => transportMode.id),
			roles: item.roles.map((role) => role.id),
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
			transportModes: model.value.transportModes,
			code: model.value.code,
			name: model.value.name,
			roles: model.value.roles,
		}
		if(itemId.value) {
			await $fetch(`/api/travelTransportReasons/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/travelTransportReasons', {
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
	:title="`Grund für die Wahl des Verkehrsmittels ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		TravelTransportReasonCodeInput(v-model="model.code")
		TravelTransportReasonNameInput(v-model="model.name")
		TravelTransportReasonTransportModesInput(v-model="model.transportModes")
		TravelTransportReasonRolesInput(v-model="model.roles")
</template>
