<script setup lang="ts">
import type { Component } from 'vue'

import type {
	BudgetPlanFormModel,
	ExpenseAuthorizationFormModel,
	KernTaskListItems,
	LongtermContractFormModel,
	OrganizationItem,
	RepresentationAllowanceFormModel,
	WorkflowCustomCandidateFormModel,
} from '~/types'

import {
	BudgetPlanForm,
	ExpenseAuthorizationForm,
	LongtermContractForm,
	RepresentationAllowanceForm,
	WorkflowCustomCandidateForm,
} from '#components'

const route = useRoute('processes-create-workflow')
const authStore = useAuthStore()
authStore.requireLogin()

const { data: workflow } = useFetch(`/api/workflows/${route.params.workflow}`)
// Awaited so that the presets are already applied in the server-rendered HTML.
const { data: mutations } = await useFetch('/api/workflowMutations', {
	query: {
		workflow: route.params.workflow,
	},
})

const { availableTypes } = useProcessInitiatorTypes(() => workflow.value?.allowedInitiators)

const selectedInitiatorType = ref<ProcessInitiatorType | null>(null)
const selectedInitiatorOrganizationItem = ref<OrganizationItem>(null)

const initiatorType = computed<ProcessInitiatorType | null>({
	get: () =>
		selectedInitiatorType.value && availableTypes.value.includes(selectedInitiatorType.value)
			? selectedInitiatorType.value
			: availableTypes.value[0] ?? null,
	set: (type) => {
		selectedInitiatorType.value = type
	},
})

const initiatorOrganizationItem = computed<OrganizationItem>({
	get: () => initiatorType.value === 'organizationItem'
		? selectedInitiatorOrganizationItem.value
		: null,
	set: (item) => {
		selectedInitiatorOrganizationItem.value = item
	},
})

const model = ref({
	candidate: {
		electionCommittee: null,
		candidate: null,
		applicationLetter: null,
		callName: null,
		pronouns: null,
		matriculationNumber: null,
		course: null,
		postalAddress: '',
		photo: null,
	} satisfies WorkflowCustomCandidateFormModel,
	budgetPlan: {
		budget: null,
		startDate: null,
		endDate: null,
		items: [],
	} satisfies BudgetPlanFormModel,
	expenseAuthorization: {
		budgetPlanItem: null,
		budget: null,
		title: '',
		description: null,
		amount: 0,
		items: [],
	} satisfies ExpenseAuthorizationFormModel,
	longtermContract: {
		budget: null,
		title: '',
		description: null,
		startDate: null,
		endDate: null,
		items: [],
	} satisfies LongtermContractFormModel,
	representationAllowance: {
		title: '',
		description: null,
		periodUnit: 'month',
		startDate: null,
		endDate: null,
		recipients: [],
	} satisfies RepresentationAllowanceFormModel,
})

function modelKey(table: string) {
	return table.substring(0, table.length - 1) as keyof typeof model.value
}

/** The model of the form of a mutation, if this page has a form for its table. */
function modelOf(table: string): object | undefined {
	return model.value[modelKey(table)]
}

watch(mutations, (items) => {
	for(const mutation of items ?? []) {
		const target = modelOf(mutation.table)
		if(!target) continue
		applyProcessPresetValues(target, mutation.resolvedPresets)
	}
}, { immediate: true })

/**
 * Whether the initiator has to be asked at all. If they may only act for
 * themselves, there is nothing to choose and the step is left out.
 */
const metaTaskVisible = computed(() =>
	availableTypes.value.length !== 1 || availableTypes.value[0] !== 'person')

const formsByTable: Record<string, Component> = {
	candidates: WorkflowCustomCandidateForm,
	budgetPlans: BudgetPlanForm,
	expenseAuthorizations: ExpenseAuthorizationForm,
	longtermContracts: LongtermContractForm,
	representationAllowances: RepresentationAllowanceForm,
}

function summaryItemsOf(form: Component) {
	return 'summaryItems' in form && typeof form.summaryItems === 'number'
		? form.summaryItems
		: 0
}

const mutationForms = computed(() => {
	let summaryOffset = metaTaskVisible.value ? 1 : 0
	return (mutations.value ?? []).flatMap((mutation) => {
		const form = formsByTable[mutation.table]
		if(!form) return []

		const offset = summaryOffset
		summaryOffset += summaryItemsOf(form)

		return [ {
			form,
			key: modelKey(mutation.table),
			meta: mutation.meta,
			presets: mutation.resolvedPresets,
			summaryOffset: offset,
		} ]
	})
})

const metaTaskDone = computed(() =>
	initiatorType.value === 'person' ||
	(
		initiatorType.value === 'organizationItem' &&
		!!initiatorOrganizationItem.value
	),
)

const mutationTasks = computed(() => (mutations.value ?? []).flatMap((mutation) => {
	const tasks = processFormTasks(
		mutation.table,
		modelOf(mutation.table),
		mutation.resolvedPresets,
		mutation.meta,
	)
	return tasks ? [ tasks ] : []
}))

const valid = computed(() => metaTaskDone.value && mutationTasks.value
	.every((form) => form.tasks
		.every((task) => task.status === 'done')),
)

const items = computed<KernTaskListItems>(() => [
	...metaTaskVisible.value
		? [ {
			title: 'Daten zur*zum Anforderer*in',
			tasks: [
				{
					id: 'meta-role',
					label: 'Rolle auswählen',
					status: metaTaskDone.value ? 'done' : 'open',
				},
			],
		} ] satisfies KernTaskListItems
		: [],
	...mutationTasks.value.filter((form) => form.tasks.length > 0),
	{
		title: 'Zusammenfassung',
		tasks: [
			{
				id: 'summary',
				label: 'Eingaben überprüfen',
				status: mutationTasks.value.some((form) =>
					form.tasks.some((task) => task.status === 'blocked'),
				)
					? 'blocked'
					: 'open',
			},
		],
	},
])

const flatItems = computed(() => items.value.flatMap((item) => item.tasks))

/** The step the initiator opened, `null` as long as they opened none. */
const openedItem = ref<string | null>(null)

/**
 * The step that is shown. The first one is open right away, on mobile it is
 * covered by the task list until the initiator opens a step.
 */
const selectedItem = computed(() => openedItem.value ?? flatItems.value[0]?.id ?? null)

const selectedItemIndex = computed(() => flatItems.value.findIndex((task) => task.id === selectedItem.value))
const selectedItemTask = computed(() => flatItems.value[selectedItemIndex.value] ?? null)

async function create() {
	const body = {
		initiatorType: initiatorType.value,
		initiatorOrganizationItem: initiatorOrganizationItem.value?.id ?? null,
		workflow: route.params.workflow,
		mutations: (mutations.value ?? []).map((mutation) => ({
			mutation: mutation.id,
			dataId: null,
		})),
	}

	const formData = new FormData()
	formData.append('data', JSON.stringify(body))

	for(const mutation of mutations.value ?? []) {
		const encodedModel = encodeFormModel(
			// @ts-expect-error | Table is not typed correctly
			mutation.table,
			model.value[modelKey(mutation.table)],
		)
		Object.entries(encodedModel).forEach(([ key, value ]) => {
			formData.append(`mutation_${mutation.id}_${key}`, value)
		})
	}

	const response = await $fetch('/api/processes', {
		method: 'POST',
		body: formData,
	})
	await navigateTo(`/processes/view/${response.id}`)
}
</script>

<template lang="pug">
header
	p.kern-preline Neuen Prozess erstellen
	h1.kern-heading-large {{ workflow?.name }} ({{ workflow?.code }})
.mb-8(v-if="workflow?.description")
	KernText(:text="workflow.description")
.kern-container(v-if="authStore.loggedIn")
	.kern-row
		.kern-col-12.kern-col-xl-4(
			:class="{ 'hide-mobile': openedItem !== null }"
		)
			KernTaskList(
				:items="items"
				@select="openedItem = $event"
			)
		.kern-col-12.kern-col-xl-8(
			:class="{ 'hide-mobile': openedItem === null }"
		)
			h2.kern-heading-medium(
				v-if="selectedItemTask"
			) Schritt {{ selectedItemIndex + 1 }}: {{ selectedItemTask.label }}
			template(v-if="selectedItem === 'meta-role'")
				ProcessInitiatorInput(
					v-model:type="initiatorType"
					v-model:organization-item="initiatorOrganizationItem"
					:allowed-initiators="workflow?.allowedInitiators"
				)
			template(v-if="selectedItem === 'summary' && metaTaskVisible")
				KernSummary(
					:number="1"
					title="Angaben zur Anforderer*in"
					:items=`[
						{
							key: 'Anforderer*in',
							value: initiatorType === 'person'
								? (authStore.userInfo.person ? formatPerson(authStore.userInfo.person) : 'Gast')
								: initiatorOrganizationItem
									? formatOrganizationItem(initiatorOrganizationItem)
									: 'Keine Angabe',
						},
					]`
					@click.prevent="selectedItem = 'meta-role'"
				)
			template(
				v-for="(form, idx) of mutationForms"
				:key="idx"
			)
				component(
					:is="form.form"
					v-model="model[form.key]"
					:selected-item="selectedItem"
					:summary-offset="form.summaryOffset"
					:meta="form.meta"
					:presets="form.presets"
					@select="openedItem = $event"
				)
			.kern-container(
				v-if="selectedItemTask"
			)
				.kern-row
					.kern-col.text-left
						button.kern-btn.kern-btn--secondary(
							v-if="selectedItemIndex > 0"
							type="button"
							@click="openedItem = flatItems[selectedItemIndex - 1]?.id ?? null"
						)
							span.kern-icon.kern-icon--arrow-back
							span.kern-label Zurück
						button.kern-btn.kern-btn--secondary.hide-desktop(
							v-else
							type="button"
							@click="openedItem = null"
						)
							span.kern-icon.kern-icon--arrow-back
							span.kern-label Zurück zur Übersicht
					.kern-col.text-right
						button.kern-btn.kern-btn--primary(
							v-if="selectedItemIndex < flatItems.length - 1"
							type="button"
							@click="openedItem = flatItems[selectedItemIndex + 1]?.id ?? null"
						)
							span.kern-label Weiter
							span.kern-icon.kern-icon--arrow-forward
						button.kern-btn.kern-btn--primary(
							v-else-if="selectedItemIndex === flatItems.length - 1"
							type="button"
							:disabled="!valid"
							@click="create()"
						)
							span.kern-label Erstellen
							span.kern-icon.kern-icon--check
</template>

<style scoped>
.hide-mobile {
	display: none;

	@media (min-width: 1200px) {
		display: initial;
	}
}

.hide-desktop {
	@media (min-width: 1200px) {
		display: none;
	}
}
</style>
