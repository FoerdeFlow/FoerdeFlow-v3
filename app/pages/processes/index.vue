<script setup lang="ts">
const { data } = useFetch('/api/processes')
const router = useRouter()

async function create() {
	await router.push({
		name: 'processes-create',
	})
}
</script>

<template lang="pug">
h1.kern-heading-large Prozesse
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
		em {{ formatDatetime(item.createdAt, 'compact') }}
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
			em seit {{ formatDatetime(item.previousStep.modifiedAt ?? null, 'compact') }}
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to="{ name: 'processes-view-process', params: { process: item.id } }"
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
</template>
