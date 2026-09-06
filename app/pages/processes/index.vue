<script setup lang="ts">
import { FetchError } from 'ofetch'

const { data } = useFetch('/api/processes')
const { data: drafts, refresh: refreshDrafts } = useFetch('/api/processDrafts')
const router = useRouter()
const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()

async function create() {
	await router.push({
		name: 'processes-create',
	})
}

async function removeDraft({ id }: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: 'Entwurf verwerfen?',
		text: 'Sind Sie sicher, dass Sie diesen Entwurf verwerfen möchten?',
	})) {
		try {
			await $fetch(`/api/processDrafts/${id}`, { method: 'DELETE' })
			await refreshDrafts()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: 'Fehler beim Verwerfen',
					text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
				})
			}
		}
	}
}
</script>

<template lang="pug">
h1.kern-heading-large Prozesse
KernTable.mb-8(
	v-if="drafts?.length"
	caption="Liste deiner gespeicherten Entwürfe"
	:columns="[ 'workflow', 'modified' ]"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="true"
	:data="drafts"
	show-actions
	@remove="removeDraft"
)
	template(#workflow-header)
		| Workflow
		br
		| Titel
	template(#workflow-body="{ item }")
		em {{ item.workflow.code }}
		br
		| {{ item.title ?? item.workflow.name }}
	template(#modified-header)
		| Zuletzt bearbeitet
	template(#modified-body="{ item }")
		| {{ formatDatetime(item.modifiedAt, 'compact') }}
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to="{ name: 'processes-create-workflow', params: { workflow: item.workflow.id }, query: { draft: item.id } }"
		)
			span.kern-icon.kern-icon--edit(aria-hidden="true")
			span.kern-label.kern-sr-only Weiterbearbeiten
KernTable(
	caption="Liste deiner aktiven Prozesse"
	:columns="[ 'workflow', 'initiator', 'status', 'assignee' ]"
	create-permission="workflowProcesses.create"
	:update-permission="null"
	:delete-permission="null"
	:data="data ?? []"
	show-actions
	@create="create"
)
	template(#workflow-header)
		| Workflow
		br
		| Titel
	template(#workflow-body="{ item }")
		em {{ item.workflow.code }}
		br
		| {{ item.mutations[0]?.title }}
	template(#initiator-header)
		| Antragsteller*in
		br
		| Antragsdatum
	template(#initiator-body="{ item }")
		template(v-if="item.initiatorType === 'person'")
			| {{ formatPerson(item.initiatorPerson) }}
		template(v-if="item.initiatorType === 'organizationItem'")
			| {{ formatOrganizationItem(item.initiatorOrganizationItem) }}
		br
		span.kern-body.kern-body--small {{ formatDatetime(item.createdAt, 'compact') }}
	template(#status-header)
		| Status
	template(#status-body="{ item }")
		ProcessStatusBadge(:status="item.status")
	template(#assignee-header)
		| Zuständig
	template(#assignee-body="{ item }")
		template(v-if="item.currentStep?.step.type === 'job'")
			| –
		template(v-else-if="item.currentStep?.step.assignee === 'initiator'")
			em Anforderer*in
		template(v-else-if="item.currentStep?.step.assignee === 'referencedPerson'")
			em {{ $t(`processes.${item.currentStep.step.assigneeReferencedPerson}`) }}
		template(v-else-if="item.currentStep?.step.assignee === 'organizationItem'")
			| {{ formatOrganizationItem(item.currentStep.step.assigneeOrganizationItem) }}
		template(v-if="item.previousStep")
			br
			span.kern-body.kern-body--small seit {{ formatDatetime(item.previousStep.modifiedAt ?? null, 'compact') }}
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to="{ name: 'processes-view-process', params: { process: item.id } }"
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
</template>
