<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'
import type { Person, Role, OrganizationType, OrganizationItem } from '~/types'

const props = defineProps<{
	workflow: string
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	person: Person
	role: Role
	organizationType: OrganizationType
	organizationItem: OrganizationItem
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
			person: null,
			role: null,
			organizationType: null,
			organizationItem: null,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/workflowAllowedInitiators/${id}`)
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
			person: model.value.person?.id ?? null,
			role: model.value.role?.id ?? null,
			organizationType: model.value.organizationType?.id ?? null,
			organizationItem: model.value.organizationItem?.id ?? null,
		}
		if(itemId.value) {
			await $fetch(`/api/workflowAllowedInitiators/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/workflowAllowedInitiators', {
				method: 'POST',
				body: {
					...body,
					workflow: props.workflow,
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
	:title="`Zugelassenen Workflow-Initiator ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		WorkflowAllowedInitiatorInitiatorInput(
			v-model:person="model.person"
			v-model:role="model.role"
			v-model:organization-type="model.organizationType"
			v-model:organization-item="model.organizationItem"
		)
</template>
