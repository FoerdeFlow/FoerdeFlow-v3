<script setup lang="ts">
import type { ProcessSignatureEditor, ProcessStepConnectionEditor, ProcessStepEditor } from '#components'
import type {
	BudgetPlanFormModel,
	ExpenseAuthorizationFormModel,
	LongtermContractFormModel,
	RepresentationAllowanceFormModel,
	WorkflowCustomCandidateFormModel,
	WorkflowCustomPersonFormModel,
	WorkflowCustomPersonPhotoFormModel,
} from '~/types'

const route = useRoute('processes-view-process')
const editor = useTemplateRef<typeof ProcessStepEditor>('editor')
const connectionEditor = useTemplateRef<typeof ProcessStepConnectionEditor>('connectionEditor')
const signatureEditor = useTemplateRef<typeof ProcessSignatureEditor>('signatureEditor')

const { data, refresh } = useFetch(`/api/processes/${route.params.process}`)

const processTitle = computed(() => {
	const first = data.value?.mutations[0]?.data
	return (first && 'title' in first ? first.title : null) ?? data.value?.workflow.name
})

/** The applications this process waits for before it can be completed. */
const openDependencies = computed(() =>
	(data.value?.dependencies ?? []).filter((dependency) => dependency.status !== 'completed'))

function dependencyText(status: 'pending' | 'completed' | 'failed' | null) {
	if(status === 'pending') {
		return 'Die Ausgabe soll aus einem Haushaltsplan bezahlt werden, der noch ' +
			'beantragt ist. Dieser Prozess kann erst abgeschlossen werden, wenn der ' +
			'Haushaltsplan genehmigt wurde.'
	}
	return 'Der Antrag auf Genehmigung des Haushaltsplans, aus dem die Ausgabe bezahlt ' +
		'werden soll, ' + (status === 'failed' ? 'wurde abgelehnt' : 'existiert nicht mehr') +
		'. Dieser Prozess kann nicht mehr abgeschlossen werden.'
}

function openEditor(id: string) {
	if(!editor.value) return
	editor.value.open(id)
}

function openConnectionEditor(id: string, organizationItem: string) {
	if(!connectionEditor.value) return
	connectionEditor.value.open(id, organizationItem)
}

function openSignatureEditor(id: string) {
	if(!signatureEditor.value) return
	signatureEditor.value.open(id)
}

function openSignaturePdf(id: string) {
	window.open(`/api/processSignatures/${id}/pdf`, '_blank')
}

const asBudgetPlan = (data: unknown) => data as BudgetPlanFormModel
const asExpenseAuthorization = (data: unknown) => data as ExpenseAuthorizationFormModel
const asLongtermContract = (data: unknown) => data as LongtermContractFormModel
const asRepresentationAllowance = (data: unknown) => data as RepresentationAllowanceFormModel
const asCandidate = (data: unknown) => data as WorkflowCustomCandidateFormModel
const asPerson = (data: unknown) => data as WorkflowCustomPersonFormModel
const asPersonPhoto = (data: unknown) => data as WorkflowCustomPersonPhotoFormModel
</script>

<template lang="pug">
header
	p.kern-preline Prozessübersicht
	h1.kern-heading-large {{ data?.workflow.code }}: {{ processTitle }}
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
	.kern-description-list-item(v-if="data.paperStatus !== 'notRequired'")
		dt.kern-description-list-item__key Unterschriften
		dd.kern-description-list-item__value
			ProcessPaperStatusBadge(:status="data.paperStatus")
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
template(
	v-for="dependency of openDependencies"
	:key="dependency.process"
)
	KernAlert(
		:type="dependency.status === 'pending' ? 'warning' : 'danger'"
		:dismissible="false"
		title="Abhängigkeit von einem anderen Antrag"
		:text="dependencyText(dependency.status)"
	)
	p.kern-body.mb-4
		NuxtLink.kern-link(
			:to="`/processes/view/${dependency.process}`"
		) Zum Antrag auf Genehmigung des Haushaltsplans{{ dependency.workflow ? ` (${dependency.workflow.code})` : '' }}
section.my-8(
	v-for="mutation of data?.mutations"
	:key="mutation.id"
)
	header
		h2.kern-heading-medium {{ $t(`${mutation.mutation.table.substring(0, mutation.mutation.table.length - 1)}.${mutation.mutation.action}.title`) }}
	BudgetPlanForm(
		v-if="mutation.mutation.table === 'budgetPlans'"
		readonly
		selected-item="summary"
		:model-value="asBudgetPlan(mutation.data)"
	)
	ExpenseAuthorizationForm(
		v-if="mutation.mutation.table === 'expenseAuthorizations'"
		:meta="mutation.mutation.meta"
		readonly
		selected-item="summary"
		:model-value="asExpenseAuthorization(mutation.data)"
	)
	LongtermContractForm(
		v-if="mutation.mutation.table === 'longtermContracts'"
		readonly
		selected-item="summary"
		:model-value="asLongtermContract(mutation.data)"
	)
	RepresentationAllowanceForm(
		v-if="mutation.mutation.table === 'representationAllowances'"
		readonly
		selected-item="summary"
		:model-value="asRepresentationAllowance(mutation.data)"
	)
	WorkflowCustomCandidateForm(
		v-if="mutation.mutation.table === 'candidates'"
		readonly
		selected-item="summary"
		:process-id="route.params.process"
		:mutation-id="mutation.mutation.id"
		:model-value="asCandidate(mutation.data)"
		:attachments="mutation.attachments"
	)
	WorkflowCustomPersonForm(
		v-if="mutation.mutation.table === 'persons'"
		readonly
		selected-item="summary"
		:model-value="asPerson(mutation.data)"
	)
	WorkflowCustomPersonPhotoForm(
		v-if="mutation.mutation.table === 'personPhotos'"
		readonly
		selected-item="summary"
		:process-id="route.params.process"
		:mutation-id="mutation.mutation.id"
		:model-value="asPersonPhoto(mutation.data)"
		:attachments="mutation.attachments"
	)
KernTable.mt-8(
	caption="Übersicht der Prozessschritte"
	:columns="[ 'stage', 'step', 'assignee', 'type', 'status' ]"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	:show-actions="data?.status !== 'completed' && data?.steps.some((step) => step.editable)"
	:data="data?.steps ?? []"
)
	template(#stage-header)
		| Lfd.
	template(#stage-body="{ item }")
		| {{ item.step.stage }}
	template(#step-header)
		| Schritt
	template(#step-body="{ item }")
		| {{ item.step.name }}
		template(v-if="item.comment")
			br
			KernText(
				size="small"
				:text="item.step.commentLabel ? `${item.step.commentLabel}: ${item.comment}` : item.comment"
			)
	template(#assignee-header)
		| Zuständig
	template(#assignee-body="{ item }")
		template(v-if="item.step.type === 'job'")
			| –
		template(v-else-if="item.step.assignee === 'initiator'")
			em Anforderer*in
		template(v-else-if="item.step.assignee === 'referencedPerson'")
			| {{ formatReferencedPerson(item.step.assigneeReferencedPerson, data?.mutations) }}
		template(v-else-if="item.step.assignee === 'organizationItem'")
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
			v-if="item.editable"
			type="button"
			@click="openEditor(item.id)"
		)
			template(v-if="item.status === 'pending'")
				span.kern-icon.kern-icon--add(aria-hidden="true")
				span.kern-label.kern-sr-only Schritt bearbeiten
			template(v-else)
				span.kern-icon.kern-icon--edit(aria-hidden="true")
				span.kern-label.kern-sr-only Schritt erneut bearbeiten
		button.kern-btn.kern-btn--tertiary(
			v-if=`
				item.editable &&
				item.status === 'pending' &&
				item.step.assignee === 'organizationItem' &&
				[ 'comment', 'approval' ].includes(item.step.type)
			`
			type="button"
			@click="openConnectionEditor(item.id, item.step.assigneeOrganizationItem?.id ?? '')"
		)
			span.kern-icon.kern-icon--content-copy(aria-hidden="true")
			span.kern-label.kern-sr-only Zu OpenSlides übertragen
section.mt-8(v-if="data?.signatures.length")
	h2.kern-heading-medium Unterschriften
	KernTable(
		caption="Übersicht der erforderlichen Papierunterschriften"
		:columns="[ 'name', 'assignee', 'status' ]"
		:create-permission="null"
		:update-permission="null"
		:delete-permission="null"
		show-actions
		:data="data?.signatures ?? []"
	)
		template(#name-header)
			| Dokument
		template(#name-body="{ item }")
			| {{ item.signature.name }}
			template(v-if="item.comment")
				br
				KernText(
					size="small"
					:text="item.comment"
				)
		template(#assignee-header)
			| Bestätigung durch
		template(#assignee-body="{ item }")
			template(v-if="item.signature.assignee === 'initiator'")
				em Anforderer*in
			template(v-else-if="item.signature.assignee === 'referencedPerson'")
				| {{ formatReferencedPerson(item.signature.assigneeReferencedPerson, data?.mutations) }}
			template(v-else-if="item.signature.assignee === 'organizationItem'")
				| {{ formatOrganizationItem(item.signature.assigneeOrganizationItem) }}
		template(#status-header)
			| Status
		template(#status-body="{ item }")
			ProcessSignatureStatusBadge(:status="item.status")
		template(#actions="{ item }")
			button.kern-btn.kern-btn--tertiary(
				v-if="item.due"
				type="button"
				@click="openSignaturePdf(item.id)"
			)
				span.kern-icon.kern-icon--download(aria-hidden="true")
				span.kern-label.kern-sr-only Unterschriftendokument herunterladen
			button.kern-btn.kern-btn--tertiary(
				v-if="item.due && item.confirmable"
				type="button"
				@click="openSignatureEditor(item.id)"
			)
				span.kern-icon.kern-icon--edit(aria-hidden="true")
				span.kern-label.kern-sr-only Unterschrifteneingang bestätigen
ProcessStepEditor(
	ref="editor"
	@refresh="refresh"
)
ProcessSignatureEditor(
	ref="signatureEditor"
	@refresh="refresh"
)
ProcessStepConnectionEditor(
	ref="connectionEditor"
)
</template>
