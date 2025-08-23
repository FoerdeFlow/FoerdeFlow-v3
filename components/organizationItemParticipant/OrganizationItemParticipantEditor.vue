<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'

const props = defineProps<{
	organizationItem: string
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	groupName: string
	participantMembershipType: string
	participantOrganizationItem: string
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
			groupName: '',
			participantMembershipType: '',
			participantOrganizationItem: '',
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/organizationItemParticipants/${id}`)
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
		const body = {
			...model.value,
			organizationItem: props.organizationItem,
		}
		if(itemId.value) {
			await $fetch(`/api/organizationItemParticipants/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/organizationItemParticipants', {
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
	:title="`Sitzungsteilnahmegruppe ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		OrganizationItemParticipantGroupNameInput(v-model="model.groupName")
		OrganizationItemParticipantParticipantOrganizationItemInput(v-model="model.participantOrganizationItem")
		OrganizationItemParticipantParticipantMembershipTypeInput(v-model="model.participantMembershipType")
</template>
