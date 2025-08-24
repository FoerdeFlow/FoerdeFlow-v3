<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'
import type { MembershipType, OrganizationItem } from '~/types'

const props = defineProps<{
	organizationItem: string
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	groupName: string
	roleName: string
	isSessionParticipant: boolean
	members: {
		organizationItem: OrganizationItem
		membershipType: MembershipType
	}[]
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
			roleName: '',
			isSessionParticipant: false,
			members: [],
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/organizationItemGroups/${id}`)
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
			organizationItem: props.organizationItem,
			groupName: model.value.groupName,
			roleName: model.value.roleName,
			isSessionParticipant: model.value.isSessionParticipant,
			members: model.value.members.map((member) => ({
				organizationItem: member.organizationItem?.id,
				membershipType: member.membershipType?.id,
			})),
		}
		if(itemId.value) {
			await $fetch(`/api/organizationItemGroups/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/organizationItemGroups', {
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
	:title="`OE-Gruppe ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		OrganizationItemGroupGroupNameInput(v-model="model.groupName")
		OrganizationItemGroupRoleNameInput(v-model="model.roleName")
		OrganizationItemGroupMembersInput(v-model="model.members")
</template>
