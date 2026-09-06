<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { OrganizationItem } from '~/types'

import { KernDialog } from '#components'

const props = defineProps<{
	workflow: string
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	stage: number
	code: string
	name: string
	description: string | null
	hint: string | null
	mutation: string | null
	lines: { label: string, hint: string | null }[]
	assignee: 'initiator' | 'referencedPerson' | 'organizationItem'
	assigneeReferencedPerson: string | null
	assigneeOrganizationItem: OrganizationItem
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

const valid = computed(() => {
	if(!model.value) return false
	return Boolean(model.value.mutation) &&
		model.value.lines.length > 0 &&
		model.value.lines.every((line) => line.label.trim() !== '')
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
			description: null,
			hint: null,
			mutation: null,
			lines: [ { label: '', hint: null } ],
			assignee: 'organizationItem',
			assigneeReferencedPerson: null,
			assigneeOrganizationItem: null,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/workflowSignatures/${id}`)
		openDialog(id, {
			stage: item.stage,
			code: item.code,
			name: item.name,
			description: item.description,
			hint: item.hint,
			mutation: item.mutation,
			lines: item.lines,
			assignee: item.assignee,
			assigneeReferencedPerson: item.assigneeReferencedPerson,
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
			description: model.value.description,
			hint: model.value.hint,
			mutation: model.value.mutation,
			lines: model.value.lines.map((line) => ({
				label: line.label,
				hint: line.hint === '' ? null : line.hint,
			})),
			assignee: model.value.assignee,
			assigneeReferencedPerson: model.value.assignee === 'referencedPerson'
				? model.value.assigneeReferencedPerson
				: null,
			assigneeOrganizationItem: model.value.assignee === 'organizationItem'
				? model.value.assigneeOrganizationItem?.id
				: null,
		}
		if(itemId.value) {
			await $fetch(`/api/workflowSignatures/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/workflowSignatures', {
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
	:title="`Unterschrift ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		WorkflowSignatureStageInput(v-model="model.stage")
		WorkflowSignatureCodeInput(v-model="model.code")
		WorkflowSignatureNameInput(v-model="model.name")
		WorkflowSignatureDescriptionInput(v-model="model.description")
		WorkflowSignatureMutationInput(
			v-model="model.mutation"
			:workflow="props.workflow"
		)
		WorkflowSignatureHintInput(v-model="model.hint")
		WorkflowSignatureLinesInput(v-model="model.lines")
		WorkflowSignatureAssigneeInput(
			v-model:type="model.assignee"
			v-model:referenced-person="model.assigneeReferencedPerson"
			v-model:organization-item="model.assigneeOrganizationItem"
		)
</template>
