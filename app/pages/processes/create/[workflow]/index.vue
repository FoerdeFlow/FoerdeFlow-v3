<script setup lang="ts">
import type { KernTaskListItems, OrganizationItem } from '~/types'
import { ExpenseAuthorizationForm } from '#components'

const route = useRoute('processes-create-workflow')
const authStore = useAuthStore()

const { data: workflow } = useFetch(`/api/workflows/${route.params.workflow}`)
const { data: mutations } = useFetch('/api/workflowMutations', {
	query: {
		workflow: route.params.workflow,
	},
})

const metaModel = ref({
	initiatorType: 'person' as 'person' | 'organizationItem',
	initiatorOrganizationItem: null as OrganizationItem,
})

const model = ref({
	expenseAuthorization: {
		budgetPlanItem: null,
		title: '',
		description: null,
		amount: 0,
		items: [],
	} satisfies InstanceType<typeof ExpenseAuthorizationForm>['$props']['modelValue'],
})

const mutationForms = computed(() =>
	mutations.value
		?.map((mutation) => ({
			expenseAuthorizations: ExpenseAuthorizationForm,
		}[mutation.table]) ?? null)
		.filter((form) => form !== null) ?? [],
)

const forms = useTemplateRef<InstanceType<
	typeof ExpenseAuthorizationForm
>[]>('forms')

const valid = computed(() => forms.value
	?.every((form) => form.tasks
		.every((task) => task.status === 'done')) ?? false,
)

const items = computed<KernTaskListItems>(() => [
	{
		title: 'Daten zur*zum Anforderer*in',
		tasks: [
			{
				id: 'meta-role',
				label: 'Rolle auswählen',
				status:
					metaModel.value.initiatorType === 'person' ||
					(
						metaModel.value.initiatorType === 'organizationItem' &&
						metaModel.value.initiatorOrganizationItem
					)
						? 'done'
						: 'open',
			},
		],
	},
	...(forms.value?.map((form) => ({
		title: form.title,
		tasks: form.tasks,
	})) ?? []),
	{
		title: 'Zusammenfassung',
		tasks: [
			{
				id: 'summary',
				label: 'Eingaben überprüfen',
				status: 'open',
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
			data: encodeFormModel(
				// @ts-expect-error | Table is not typed correctly
				mutation.table,
				model.value[
					mutation.table.substring(
						0,
						mutation.table.length - 1,
					) as keyof typeof model.value
				],
			),
		})),
	}
	const response = await $fetch('/api/processes', {
		method: 'POST',
		body,
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
.kern-container
	.kern-row
		.kern-col-12.kern-col-xl-4
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
					:is="form"
					ref="forms"
					v-model="model.expenseAuthorization"
					:selected-item="selectedItem"
					:summary-offset="mutationForms.slice(0, idx).map(form => form.summaryItems).reduce((a, b) => a + b, 1)"
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
