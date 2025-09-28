<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'
import type { MembershipType, OrganizationItem, OrganizationType, Person } from '~/types'

const props = defineProps<{
	role: string
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	person: Person
	organizationItem: OrganizationItem
	organizationType: OrganizationType
	membershipType: MembershipType
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

const occupantType = ref<'person' | 'membership' | 'anonymous' | null>(null)
function onChangeOccupantType() {
	if(!model.value) return
	model.value.person = null
	model.value.organizationItem = null
	model.value.organizationType = null
	model.value.membershipType = null
}

const isOrganizationItemGroup = ref(false)
function onChangeIsOrganizationItemGroup() {
	if(!model.value) return
	model.value.organizationItem = null
	model.value.organizationType = null
}

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
			person: null,
			organizationItem: null,
			organizationType: null,
			membershipType: null,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/roleOccupants/${id}`)
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
			role: props.role,
			person: model.value.person?.id ?? null,
			organizationItem: model.value.organizationItem?.id ?? null,
			organizationType: model.value.organizationType?.id ?? null,
			membershipType: model.value.membershipType?.id ?? null,
		}
		if(itemId.value) {
			await $fetch(`/api/roleOccupants/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/roleOccupants', {
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

const valid = computed(() => {
	if(!model.value) return false
	switch(occupantType.value) {
		case 'person':
			return Boolean(model.value.person)
		case 'membership':
			if(isOrganizationItemGroup.value) {
				return Boolean(model.value.organizationType) && Boolean(model.value.membershipType)
			}
			return Boolean(model.value.organizationItem) && Boolean(model.value.membershipType)
		case 'anonymous':
			return true
	}
	return false
})
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="`Rolleninhaber*in ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		RoleOccupantTypeSelect(
			v-model="occupantType"
			@change="onChangeOccupantType"
		)
		template(v-if="occupantType === 'person'")
			RoleOccupantPersonInput(v-model="model.person")
		template(v-if="occupantType === 'membership'")
			RoleOccupantIsOrganizationItemGroupInput(
				v-model="isOrganizationItemGroup"
				@change="onChangeIsOrganizationItemGroup"
			)
			RoleOccupantOrganizationItemInput(
				v-if="!isOrganizationItemGroup"
				v-model="model.organizationItem"
			)
			RoleOccupantOrganizationTypeInput(
				v-else
				v-model="model.organizationType"
			)
			RoleOccupantMembershipTypeInput(v-model="model.membershipType")
</template>
