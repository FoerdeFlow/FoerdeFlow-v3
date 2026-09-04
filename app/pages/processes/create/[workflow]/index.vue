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
const { data: mutations } = useFetch('/api/workflowMutations', {
	query: {
		workflow: route.params.workflow,
	},
})

const metaModel = ref({
	initiatorType: null as ProcessInitiatorType | null,
	initiatorOrganizationItem: null as OrganizationItem,
})

const { availableTypes } = useProcessInitiatorTypes(() => workflow.value?.allowedInitiators)
watch(availableTypes, (types) => {
	if(metaModel.value.initiatorType && types.includes(metaModel.value.initiatorType)) return
	metaModel.value.initiatorType = types[0] ?? null
	metaModel.value.initiatorOrganizationItem = null
}, { immediate: true })

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

watch(mutations, (items) => {
	for(const mutation of items ?? []) {
		const target = model.value[modelKey(mutation.table)]
		if(!target) continue
		applyProcessPresetValues(target, mutation.resolvedPresets)
	}
}, { immediate: true })

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
	let summaryOffset = 1
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

const forms = useTemplateRef<InstanceType<
	/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
	| typeof WorkflowCustomCandidateForm
	| typeof BudgetPlanForm
	| typeof ExpenseAuthorizationForm
	| typeof LongtermContractForm
	| typeof RepresentationAllowanceForm
	/* eslint-enable @typescript-eslint/no-redundant-type-constituents */
>[]>('forms')

const metaTaskDone = computed(() =>
	metaModel.value.initiatorType === 'person' ||
	(
		metaModel.value.initiatorType === 'organizationItem' &&
		!!metaModel.value.initiatorOrganizationItem
	),
)

const valid = computed(() => metaTaskDone.value && (forms.value
	?.every((form) => form.tasks
		.every((task) => task.status === 'done')) ?? false),
)

const items = computed<KernTaskListItems>(() => [
	{
		title: 'Daten zur*zum Anforderer*in',
		tasks: [
			{
				id: 'meta-role',
				label: 'Rolle auswählen',
				status: metaTaskDone.value ? 'done' : 'open',
			},
		],
	},
	...(forms.value
		?.filter((form) => form.tasks.length > 0)
		.map((form) => ({
			title: form.title,
			tasks: form.tasks,
		})) ?? []),
	{
		title: 'Zusammenfassung',
		tasks: [
			{
				id: 'summary',
				label: 'Eingaben überprüfen',
				status: forms.value?.some((form) =>
					form.tasks.some((task) => task.status === 'blocked'),
				)
					? 'blocked'
					: 'open',
			},
		],
	},
])

const selectedItem = ref<string | null>(null)
const flatItems = computed(() => items.value.flatMap((item) => item.tasks))
const selectedItemIndex = computed(() => flatItems.value.findIndex((task) => task.id === selectedItem.value))
const selectedItemTask = computed(() => flatItems.value[selectedItemIndex.value] ?? null)

async function create() {
	const body = {
		initiatorType: metaModel.value.initiatorType,
		initiatorOrganizationItem: metaModel.value.initiatorOrganizationItem?.id ?? null,
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
			:class="{ 'hide-mobile': selectedItem !== null }"
		)
			KernTaskList(
				:items="items"
				@select="selectedItem = $event"
			)
		.kern-col-12.kern-col-xl-8
			h2.kern-heading-medium(
				v-if="selectedItemTask"
			) Schritt {{ selectedItemIndex + 1 }}: {{ selectedItemTask.label }}
			template(v-if="selectedItem === 'meta-role'")
				ProcessInitiatorInput(
					v-model:type="metaModel.initiatorType"
					v-model:organization-item="metaModel.initiatorOrganizationItem"
					:allowed-initiators="workflow?.allowedInitiators"
				)
			template(v-if="selectedItem === 'summary'")
				KernSummary(
					:number="1"
					title="Angaben zur Anforderer*in"
					:items=`[
						{
							key: 'Anforderer*in',
							value: metaModel.initiatorType === 'person'
								? (authStore.userInfo.person ? formatPerson(authStore.userInfo.person) : 'Gast')
								: metaModel.initiatorOrganizationItem
									? formatOrganizationItem(metaModel.initiatorOrganizationItem)
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
					ref="forms"
					v-model="model[form.key]"
					:selected-item="selectedItem"
					:summary-offset="form.summaryOffset"
					:meta="form.meta"
					:presets="form.presets"
					@select="selectedItem = $event"
				)
			.kern-container(
				v-if="selectedItemTask"
			)
				.kern-row
					.kern-col.text-left
						button.kern-btn.kern-btn--secondary(
							v-if="selectedItemIndex > 0"
							type="button"
							@click="selectedItem = flatItems[selectedItemIndex - 1]?.id ?? null"
						)
							span.kern-icon.kern-icon--arrow-back
							span.kern-label Zurück
						button.kern-btn.kern-btn--secondary.hide-desktop(
							v-else
							type="button"
							@click="selectedItem = null"
						)
							span.kern-icon.kern-icon--arrow-back
							span.kern-label Zurück zur Übersicht
					.kern-col.text-right
						button.kern-btn.kern-btn--primary(
							v-if="selectedItemIndex < flatItems.length - 1"
							type="button"
							@click="selectedItem = flatItems[selectedItemIndex + 1]?.id ?? null"
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
