<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { OrganizationItem, WorkflowStepType } from '~/types'

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
	type: WorkflowStepType
	assignee: 'initiator' | 'referencedPerson' | 'organizationItem'
	assigneeReferencedPerson: string | null
	assigneeOrganizationItem: OrganizationItem
	commentRequired: boolean
	commentLabel: string | null
	reminderEnabled: boolean
	reminderInterval: number | null
	reminderDelay: number | null
	reminderReplyTo: string | null
	reminderSubject: string
	reminderMessage: string
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

// A job is completed by the server without anyone entering a comment, so a
// required comment could never be satisfied.
const commentConfigurable = computed(() => model.value?.type !== 'job')

const valid = computed(() => {
	if(!model.value) return false
	if(!commentConfigurable.value || !model.value.commentRequired) return true
	return (model.value.commentLabel ?? '').trim() !== ''
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
			assigneeReferencedPerson: null,
			assigneeOrganizationItem: null,
			commentRequired: false,
			commentLabel: null,
			reminderEnabled: false,
			reminderInterval: reminderDefaults.interval,
			reminderDelay: reminderDefaults.delay,
			reminderReplyTo: null,
			reminderSubject: reminderDefaults.subject,
			reminderMessage: reminderDefaults.message,
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
			assigneeReferencedPerson: item.assigneeReferencedPerson,
			assigneeOrganizationItem: item.assigneeOrganizationItem,
			commentRequired: item.commentRequired,
			commentLabel: item.commentLabel,
			reminderEnabled: item.reminderEnabled,
			reminderInterval: item.reminderInterval,
			reminderDelay: item.reminderDelay,
			reminderReplyTo: item.reminderReplyTo,
			reminderSubject: item.reminderSubject,
			reminderMessage: item.reminderMessage,
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
			assigneeReferencedPerson: model.value.assignee === 'referencedPerson'
				? model.value.assigneeReferencedPerson
				: null,
			assigneeOrganizationItem: model.value.assignee === 'organizationItem'
				? model.value.assigneeOrganizationItem?.id
				: null,
			...commentConfigurable.value && model.value.commentRequired
				? {
					commentRequired: true,
					commentLabel: model.value.commentLabel,
				}
				: {
					commentRequired: false,
					commentLabel: null,
				},
			...model.value.reminderEnabled
				? {
					reminderEnabled: true,
					reminderInterval: model.value.reminderInterval,
					reminderDelay: model.value.reminderDelay,
					reminderReplyTo: model.value.reminderReplyTo,
					reminderSubject: model.value.reminderSubject,
					reminderMessage: model.value.reminderMessage,
				}
				: { reminderEnabled: false },
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
	:valid="valid"
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
			v-model:referenced-person="model.assigneeReferencedPerson"
			v-model:organization-item="model.assigneeOrganizationItem"
		)
		template(v-if="commentConfigurable")
			WorkflowStepCommentRequiredInput(v-model="model.commentRequired")
			WorkflowStepCommentLabelInput(
				v-if="model.commentRequired"
				v-model="model.commentLabel"
			)
		WorkflowStepReminderEnabledInput(v-model="model.reminderEnabled")
		template(v-if="model.reminderEnabled")
			WorkflowStepReminderIntervalInput(v-model="model.reminderInterval")
			WorkflowStepReminderDelayInput(v-model="model.reminderDelay")
			WorkflowStepReminderReplyToInput(v-model="model.reminderReplyTo")
			WorkflowStepReminderSubjectInput(v-model="model.reminderSubject")
			WorkflowStepReminderMessageInput(v-model="model.reminderMessage")
</template>
