<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'
import type { OrganizationItem, WorkflowStepType } from '~/types'

const props = defineProps<{
	workflow: string
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	stage: number
	code: string
	name: string
	type: WorkflowStepType
	assignee: 'initiator' | 'organizationItem'
	assigneeOrganizationItem: OrganizationItem
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
			stage: 1,
			code: '',
			name: '',
			type: null,
			assignee: 'initiator',
			assigneeOrganizationItem: null,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/workflowSteps/${id}`)
		openDialog(id, {
			stage: item.stage,
			code: item.code,
			name: item.name,
			type: item.type,
			assignee: item.assignee,
			assigneeOrganizationItem: item.assigneeOrganizationItem,
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
			stage: model.value.stage,
			code: model.value.code,
			name: model.value.name,
			type: model.value.type,
			assignee: model.value.assignee,
			assigneeOrganizationItem: model.value.assignee === 'organizationItem'
				? model.value.assigneeOrganizationItem?.id
				: null,
		}
		if(itemId.value) {
			await $fetch(`/api/workflowSteps/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/workflowSteps', {
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
	:title="`Workflow-Schritt ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		WorkflowStepStageInput(v-model="model.stage")
		WorkflowStepCodeInput(v-model="model.code")
		WorkflowStepNameInput(v-model="model.name")
		WorkflowStepTypeInput(v-model="model.type")
		WorkflowStepAssigneeInput(
			v-model:type="model.assignee"
			v-model:organization-item="model.assigneeOrganizationItem"
		)
</template>
