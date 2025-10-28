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
	:columns="[ 'workflow', 'title', 'initiator', 'status', 'assignee' ]"
	create-permission="workflowProcesses.create"
	:update-permission="null"
	:delete-permission="null"
	:data="data ?? []"
	show-actions
	@create="create"
)
	template(#workflow-header)
		| Workflow
	template(#workflow-body="{ item }")
		| {{ item.workflow.code }}
	template(#title-header)
		| Titel
	template(#title-body="{ item }")
		| {{ item.mutations[0]?.title }}
	template(#initiator-header)
		| Antragsteller*in
	template(#initiator-body="{ item }")
		template(v-if="item.initiatorType === 'person'")
			| {{ formatPerson(item.initiatorPerson) }}
		template(v-if="item.initiatorType === 'organizationItem'")
			| {{ formatOrganizationItem(item.initiatorOrganizationItem) }}
	template(#status-header)
		| Status
	template(#status-body="{ item }")
		ProcessStatusBadge(:status="item.status")
	template(#assignee-header)
		| Zuständig
	template(#assignee-body="{ item }")
		template(v-if="item.steps[0]?.step.assignee === 'initiator'")
			em Antragsteller*in
		template(v-if="item.steps[0]?.step.assignee === 'organizationItem'")
			| {{ formatOrganizationItem(item.steps[0].step.assigneeOrganizationItem) }}
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to="{ name: 'processes-view-process', params: { process: item.id } }"
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
</template>
