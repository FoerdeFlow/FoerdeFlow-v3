<script setup lang="ts">
import type { KernTaskListItems } from '~/types'
import { ExpenseAuthorizationForm } from '#components'

const route = useRoute('processes-create-workflow')

const { data: workflow } = useFetch(`/api/workflows/${route.params.workflow}`)
const { data: mutations } = useFetch('/api/workflowMutations', {
	query: {
		workflow: route.params.workflow,
	},
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
	await $fetch('/api/processes', {
		method: 'POST',
		body,
	})
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
			template(
				v-for="(form, idx) of mutationForms"
				:key="idx"
			)
				component(
					:is="form"
					ref="forms"
					v-model="model.expenseAuthorization"
					:selected-item="selectedItem"
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
