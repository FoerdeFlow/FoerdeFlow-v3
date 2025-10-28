<script setup lang="ts">
import type { ProcessStepEditor } from '#components'

const route = useRoute('processes-view-process')
const editor = useTemplateRef<typeof ProcessStepEditor>('editor')

const { data, refresh } = useFetch(`/api/processes/${route.params.process}`)

function openEditor(id: string) {
	if(!editor.value) return
	editor.value.open(id)
}
</script>

<template lang="pug">
header
	p.kern-preline Prozessübersicht
	h1.kern-heading-large {{ data?.workflow.code }}: {{ data?.mutations[0]?.data['title'] }}
.mb-2(v-if="data?.workflow.description")
	KernText(
		size="small"
		muted
		:text="data.workflow.description"
	)
dl.kern-description-list(v-if="data")
	.kern-description-list-item
		dt.kern-description-list-item__key Status
		dd.kern-description-list-item__value
			ProcessStatusBadge(:status="data.status")
	.kern-description-list-item
		dt.kern-description-list-item__key Workflow
		dd.kern-description-list-item__value {{ formatWorkflow(data.workflow) }}
	.kern-description-list-item
		dt.kern-description-list-item__key Anforderer*in
		dd.kern-description-list-item__value
			template(v-if="data.initiatorType === 'person'")
				| {{ formatPerson(data.initiatorPerson) }}
			template(v-if="data.initiatorType === 'organizationItem'")
				| {{ formatOrganizationItem(data.initiatorOrganizationItem) }}
section.my-8(
	v-for="mutation of data?.mutations"
	:key="mutation.id"
)
	header
		h2.kern-heading-medium {{ $t(`${mutation.mutation.table.substring(0, mutation.mutation.table.length - 1)}.${mutation.mutation.action}.title`) }}
	ExpenseAuthorizationForm(
		readonly
		selected-item="summary"
		:model-value="mutation.data"
	)
KernTable.mt-8(
	caption="Übersicht der Prozessschritte"
	:columns="[ 'stage', 'step', 'assignee', 'type', 'status' ]"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	:show-actions="data?.status !== 'completed'"
	:data="data?.steps ?? []"
)
	template(#stage-header)
		| Lfd.
	template(#stage-body="{ item }")
		| {{ item.step.stage }}
	template(#step-header)
		| Schritt
	template(#step-body="{ item }")
		| {{ item.step.name }} ({{ item.step.code }})
		template(v-if="item.comment")
			br
			KernText(
				size="small"
				:text="item.comment"
			)
	template(#assignee-header)
		| Zuständig
	template(#assignee-body="{ item }")
		template(v-if="item.step.assignee === 'initiator'")
			em Anforderer*in
		template(v-if="item.step.assignee === 'organizationItem'")
			| {{ formatOrganizationItem(item.step.assigneeOrganizationItem) }}
	template(#type-header)
		| Typ
	template(#type-body="{ item }")
		| {{ formatWorkflowStepType(item.step.type) }}
	template(#status-header)
		| Status
	template(#status-body="{ item }")
		ProcessStepStatusBadge(:status="item.status")
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			type="button"
			@click="openEditor(item.id)"
		)
			template(v-if="item.status === 'pending'")
				span.kern-icon.kern-icon--add(aria-hidden="true")
				span.kern-label.kern-sr-only Schritt bearbeiten
			template(v-else)
				span.kern-icon.kern-icon--edit(aria-hidden="true")
				span.kern-label.kern-sr-only Schritt erneut bearbeiten
ProcessStepEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
