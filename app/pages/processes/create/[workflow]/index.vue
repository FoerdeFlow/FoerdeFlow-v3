<script setup lang="ts">
import type { Component } from 'vue'

import { FetchError } from 'ofetch'

import type {
	BudgetPlanFormModel,
	ExpenseAuthorizationFormModel,
	KernTaskListItems,
	LongtermContractFormModel,
	OrganizationItem,
	PaymentOrderFormModel,
	RepresentationAllowanceFormModel,
	WorkflowCustomCandidateFormModel,
	WorkflowCustomPersonFormModel,
	WorkflowCustomPersonIbanFormModel,
	WorkflowCustomPersonPhotoFormModel,
} from '~/types'

import {
	BudgetPlanForm,
	ExpenseAuthorizationForm,
	LongtermContractForm,
	PaymentOrderForm,
	RepresentationAllowanceForm,
	WorkflowCustomCandidateForm,
	WorkflowCustomPersonForm,
	WorkflowCustomPersonIbanForm,
	WorkflowCustomPersonPhotoForm,
} from '#components'

const route = useRoute('processes-create-workflow')
const router = useRouter()
const authStore = useAuthStore()
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
authStore.requireLogin()

const { data: workflow } = useFetch(`/api/workflows/${route.params.workflow}`)
// Awaited so that the presets are already applied in the server-rendered HTML.
const { data: mutations } = await useFetch('/api/workflowMutations', {
	query: {
		workflow: route.params.workflow,
	},
})

/**
 * The draft this wizard continues, taken from the query once. It must not be
 * reactive, saving a new draft adds it to the query and would reload the page.
 */
const initialDraft = typeof route.query.draft === 'string' ? route.query.draft : null
// Awaited as well, for the same reason as the mutations.
const { data: draft } = await useFetch(`/api/processDrafts/${initialDraft}`, {
	immediate: initialDraft !== null,
})

const draftData = computed(() => draft.value ? parseProcessDraftData(draft.value.data) : null)

/** The id the draft is saved under, `null` as long as it was never saved. */
const draftId = ref(initialDraft)

/** The attachments of the draft, loaded back into files after mounting. */
const draftFiles = ref<Record<string, File>>({})

/** Whether a saved draft is worked on, either continued or saved just now. */
const editingDraft = computed(() => draftId.value !== null)

/** When the draft was saved last, shown next to the heading. */
const savedAt = ref<Date | string | null>(draft.value?.modifiedAt ?? null)

const { data: drafts } = useFetch('/api/processDrafts', {
	query: {
		workflow: route.params.workflow,
	},
})

/** Used to resolve the course of the initiator, see the prefill below. */
const { data: courses } = useFetch('/api/courses')

/**
 * The saved drafts of this workflow that can be continued instead of starting
 * over, without the one that is being worked on.
 */
const continuableDrafts = computed(() =>
	(drafts.value ?? []).filter((item) => item.id !== draftId.value))

const { availableTypes } = useProcessInitiatorTypes(() => workflow.value?.allowedInitiators)

const selectedInitiatorType = ref<ProcessInitiatorType | null>(
	draft.value?.initiatorType ?? null,
)
const selectedInitiatorOrganizationItem = ref<OrganizationItem>(
	(draftData.value?.initiatorOrganizationItem ?? null) as OrganizationItem,
)

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

/**
 * The data a person may adjust about themselves. It is typed explicitly, so
 * that the current values of the initiator can be filled in below.
 */
const ownData: WorkflowCustomPersonFormModel = {
	callName: null,
	pronouns: null,
	gender: null,
	matriculationNumber: null,
	course: null,
	postalAddress: null,
}

const ownIban: WorkflowCustomPersonIbanFormModel = {
	iban: null,
}

const ownPhoto: WorkflowCustomPersonPhotoFormModel = {
	photo: null,
}

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
	paymentOrder: {
		type: 'planned',
		budgetPlanItem: null,
		budget: null,
		expenseAuthorization: null,
		recipientType: 'reimbursement',
		recipientPerson: null,
		recipientName: null,
		recipientIban: null,
		purpose: null,
		title: '',
		description: null,
		amount: 0,
	} satisfies PaymentOrderFormModel,
	representationAllowance: {
		title: '',
		description: null,
		periodUnit: 'month',
		startDate: null,
		endDate: null,
		recipients: [],
	} satisfies RepresentationAllowanceFormModel,
	person: ownData,
	personIban: ownIban,
	personPhoto: ownPhoto,
})

function modelKey(table: string) {
	return table.substring(0, table.length - 1) as keyof typeof model.value
}

/** The model of the form of a mutation, if this page has a form for its table. */
function modelOf(table: string): object | undefined {
	return model.value[modelKey(table)]
}

// The draft is applied inside the watch, so that it also wins when the presets
// are applied again after the mutations resolved anew.
watch(mutations, (items) => {
	for(const mutation of items ?? []) {
		const target = modelOf(mutation.table)
		if(!target) continue
		applyProcessPresetValues(target, mutation.resolvedPresets)

		const draftModel = draftData.value?.model[modelKey(mutation.table)]
		if(!draftModel) continue
		applyDraftModelValues(target, draftModel, mutation.resolvedPresets)
		applyDraftModelFiles(target, modelKey(mutation.table), draftFiles.value)
	}
}, { immediate: true })

/** Whether the own data of the initiator was already filled in below. */
const ownDataPrefilled = ref(false)

/**
 * Prefills the form for the own data of the initiator with the values they have
 * at the moment, so that a field they do not touch keeps its value. Only empty
 * fields are filled, a preset or a draft always wins over the current value.
 *
 * It runs exactly once. A field the initiator cleared on purpose has to stay
 * cleared, so a later refresh of the user info must not fill it in again.
 */
watch(() => authStore.userInfo.person, (person) => {
	if(ownDataPrefilled.value || !person) return
	ownDataPrefilled.value = true

	const own = model.value.person
	own.callName ??= person.callName
	own.pronouns ??= person.pronouns
	own.gender ??= person.gender
	own.matriculationNumber ??= person.matriculationNumber
	own.postalAddress ??= person.postalAddress
	model.value.personIban.iban ??= person.iban
}, { immediate: true })

/** Whether the course of the initiator was already looked up below. */
const ownCoursePrefilled = ref(false)

/**
 * Fills in the course of the initiator, which needs a lookup of its own: the
 * session only carries its id, while the form works with the course itself. It
 * is taken from the list the select of the form loads anyway.
 */
watch([ () => authStore.userInfo.person?.course, courses ], ([ course, items ]) => {
	if(ownCoursePrefilled.value || !course || !items) return
	ownCoursePrefilled.value = true

	model.value.person.course ??= items.find((item) => item.id === course) ?? null
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
	paymentOrders: PaymentOrderForm,
	representationAllowances: RepresentationAllowanceForm,
	persons: WorkflowCustomPersonForm,
	personIbans: WorkflowCustomPersonIbanForm,
	personPhotos: WorkflowCustomPersonPhotoForm,
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
			// Set only where the workflow ties the budgets to the initiator, so
			// that every other mutation keeps offering all of them.
			organizationItem: metaBudgetScope(mutation.meta) === 'initiator'
				? initiatorOrganizationItem.value?.id ?? null
				: null,
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

/**
 * Whether the initiator still has to pick their role. Every following step
 * depends on it, so none of them may be worked on before.
 */
const followUpsBlocked = computed(() => metaTaskVisible.value && !metaTaskDone.value)

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
	...mutationTasks.value
		.filter((form) => form.tasks.length > 0)
		.map((form) => ({
			title: form.title,
			tasks: followUpsBlocked.value
				? form.tasks.map((task) => ({ ...task, status: 'blocked' as const }))
				: form.tasks,
		})),
	{
		title: 'Zusammenfassung',
		tasks: [
			{
				id: 'summary',
				label: 'Eingaben überprüfen',
				status: followUpsBlocked.value || mutationTasks.value.some((form) =>
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

/**
 * Loads the attachments of the draft back into files, so that the forms behave
 * exactly as if they had just been picked. An attachment that cannot be loaded
 * is left out, its task simply falls back to being open.
 */
async function loadDraftAttachments() {
	const data = draftData.value
	if(!draft.value || !data) return

	const files: Record<string, File> = {}
	for(const [ path, attachment ] of Object.entries(data.attachments)) {
		try {
			const blob = await $fetch<Blob>(
				`/api/processDrafts/${draft.value.id}/attachments/${path}`,
				{ responseType: 'blob' },
			)
			files[path] = new File([ blob ], attachment.name, { type: attachment.type })
		} catch(_error) {
			// The draft stays usable without the attachment.
		}
	}
	draftFiles.value = files

	for(const mutation of mutations.value ?? []) {
		const target = modelOf(mutation.table)
		if(!target) continue
		applyDraftModelFiles(target, modelKey(mutation.table), files)
	}
}

/** Everything that is saved with a draft, as a string that can be compared. */
function currentState() {
	const { model: encodedModel, attachments } = encodeDraftModel(model.value)
	return JSON.stringify({
		initiatorType: initiatorType.value,
		initiatorOrganizationItem: initiatorOrganizationItem.value?.id ?? null,
		model: encodedModel,
		attachments,
	})
}

/**
 * The state of the wizard when it was saved, `null` until it is known. It
 * starts out as the state the wizard was opened with, so that an untouched
 * wizard counts as saved.
 */
const savedState = ref<string | null>(null)
const saving = ref(false)

/** Set while the page navigates away on purpose, so that it is not guarded. */
const leaving = ref(false)

/**
 * Whether there is anything to save. As long as there is not, the button to
 * save a draft is not shown and leaving the page is not guarded.
 */
const unsaved = computed(() => savedState.value !== null && savedState.value !== currentState())

function warnUnsaved(event: BeforeUnloadEvent) {
	if(!unsaved.value) return
	event.preventDefault()
}

onMounted(async () => {
	window.addEventListener('beforeunload', warnUnsaved)
	await loadDraftAttachments()
	savedState.value = currentState()
})

onBeforeUnmount(() => {
	window.removeEventListener('beforeunload', warnUnsaved)
})

onBeforeRouteLeave(async () => {
	if(leaving.value || !unsaved.value) return true

	return await confirmDialogStore.askConfirm({
		title: 'Seite verlassen?',
		text: 'Der Zwischenstand wurde nicht gespeichert und geht dabei verloren.',
		abortLabel: 'Nein, hier bleiben',
		confirmLabel: 'Ja, verwerfen',
	}) === true
})

async function saveDraft() {
	saving.value = true
	try {
		const { model: encodedModel, attachments, files } = encodeDraftModel(model.value)

		const formData = new FormData()
		formData.append('data', JSON.stringify({
			workflow: route.params.workflow,
			initiatorType: initiatorType.value,
			initiatorOrganizationItem: initiatorOrganizationItem.value?.id ?? null,
			data: {
				version: processDraftVersion,
				initiatorOrganizationItem: initiatorOrganizationItem.value,
				model: encodedModel,
				attachments,
			},
		}))
		Object.entries(files).forEach(([ path, file ]) => {
			formData.append(`attachment_${path}`, file)
		})

		if(draftId.value) {
			await $fetch(`/api/processDrafts/${draftId.value}`, {
				method: 'PUT',
				body: formData,
			})
		} else {
			const response = await $fetch('/api/processDrafts', {
				method: 'POST',
				body: formData,
			})
			draftId.value = response.id
			await router.replace({ query: { ...route.query, draft: response.id } })
		}

		savedState.value = currentState()
		savedAt.value = new Date()
		alertStore.showAlert({
			type: 'success',
			title: 'Entwurf gespeichert',
			text: 'Der Zwischenstand kann später weiterbearbeitet werden.',
		})
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			alertStore.showAlert({
				type: 'danger',
				title: 'Fehler beim Speichern',
				text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	} finally {
		saving.value = false
	}
}

async function discardDraft() {
	if(!draftId.value) return
	if(!await confirmDialogStore.askConfirm({
		title: 'Entwurf verwerfen?',
		text: 'Der gespeicherte Zwischenstand wird gelöscht, die Eingaben gehen dabei verloren.',
	})) return

	try {
		await $fetch(`/api/processDrafts/${draftId.value}`, { method: 'DELETE' })

		leaving.value = true
		await navigateTo('/processes')
	} catch(e: unknown) {
		leaving.value = false
		if(e instanceof FetchError) {
			alertStore.showAlert({
				type: 'danger',
				title: 'Fehler beim Verwerfen',
				text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	}
}

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

	try {
		const response = await $fetch('/api/processes', {
			method: 'POST',
			body: formData,
		})

		if(draftId.value) {
			// A draft that is left behind can still be discarded from the
			// overview, so it must never block the navigation.
			await $fetch(`/api/processDrafts/${draftId.value}`, { method: 'DELETE' })
				.catch(() => { /* ignore */ })
		}

		leaving.value = true
		await navigateTo(`/processes/view/${response.id}`)
	} catch(e: unknown) {
		leaving.value = false
		if(e instanceof FetchError) {
			alertStore.showAlert({
				type: 'danger',
				title: 'Fehler beim Erstellen',
				text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	}
}
</script>

<template lang="pug">
header
	p.kern-preline {{ editingDraft ? 'Entwurf bearbeiten' : 'Neuen Prozess erstellen' }}
	h1.kern-heading-large {{ workflow?.name }} ({{ workflow?.code }})
	.mb-4.flex.flex-wrap.items-center.gap-4(v-if="editingDraft")
		span.kern-badge.kern-badge--info
			span.kern-icon.kern-icon--draft(aria-hidden="true")
			span.kern-label.kern-label--small Entwurf
		span.kern-body.kern-body--small(v-if="savedAt")
			| Zuletzt gespeichert: {{ formatDatetime(savedAt, 'compact') }}
.mb-8(v-if="workflow?.description")
	KernText(:text="workflow.description")
section.mb-8(v-if="!editingDraft && continuableDrafts.length")
	h2.kern-heading-medium Entwurf fortsetzen
	p.kern-body Für diesen Workflow sind bereits Entwürfe gespeichert. Sie können einen davon weiterbearbeiten oder unten neu beginnen.
	ul.kern-list.kern-list--bullet
		li(
			v-for="item of continuableDrafts"
			:key="item.id"
		)
			//- Loaded externally, the wizard reads the draft from the query
				once and a query change alone would not remount it.
			NuxtLink.kern-link(
				external
				:to="{ name: 'processes-create-workflow', params: { workflow: route.params.workflow }, query: { draft: item.id } }"
			) {{ item.title ?? workflow?.name }}
			span.kern-body.kern-body--small  (zuletzt bearbeitet: {{ formatDatetime(item.modifiedAt, 'compact') }})
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
					:organization-item="form.organizationItem"
					:presets="form.presets"
					@select="openedItem = $event"
				)
			.kern-container(
				v-if="selectedItemTask"
			)
				.kern-row
					.kern-col.flex.flex-wrap.items-center.justify-between.gap-4
						//- The buttons on the left keep their own container, so
							that the ones on the right stay on the right even
							when there is no button on the left.
						.flex.flex-wrap.items-center.gap-4
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
							button.kern-btn.kern-btn--tertiary(
								v-if="editingDraft"
								type="button"
								:disabled="saving"
								@click="discardDraft()"
							)
								span.kern-icon.kern-icon--delete
								span.kern-label Verwerfen
						//- Pushed to the right by itself as well, so that it
							stays there when the row wraps on narrow screens.
						.ml-auto.flex.flex-wrap.items-center.gap-4
							button.kern-btn.kern-btn--secondary(
								v-if="unsaved"
								type="button"
								:disabled="saving"
								@click="saveDraft()"
							)
								span.kern-label {{ editingDraft ? 'Speichern' : 'Als Entwurf speichern' }}
								span.kern-icon.kern-icon--draft
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
