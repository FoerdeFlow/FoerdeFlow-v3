<script lang="ts" setup>
import { FetchError } from 'ofetch'

const props = defineProps<{
	organizationItem: string
}>()

const emit = defineEmits<{
	refresh: [],
}>()

const itemId = ref<string | null>(null)

const dialog = useTemplateRef<HTMLDialogElement>('dialog')

const { data: persons } = useFetch('/api/persons')
const personFilter = ref('')
const filteredPersons = computed(() =>
	personFilter.value.length > 0
		? (persons.value?.filter((person) =>
			[
				person.callName,
				person.firstName,
				person.lastName,
				person.email,
			].some((field) => field?.toUpperCase().includes(personFilter.value.toUpperCase())),
		).slice(0, 10) ?? [])
		: [],
)

const { data: organizationItemsTree } = useFetch('/api/organizationItems')
const flattenTree = (tree: any[], prefix = ''): any[] => tree.flatMap((item) => ([
	{
		...item,
		displayName: `${prefix}${item.name} (${item.code})`,
	},
	...flattenTree(item.children, `${prefix}— `),
]))
const organizationItems = computed(() => organizationItemsTree.value ? flattenTree(organizationItemsTree.value) : [])

const { data: membershipTypes } = useFetch('/api/membershipTypes')

const { data: membershipEndReasons } = useFetch('/api/membershipEndReasons')

const model = reactive({
	memberType: '',
	memberPerson: null as string | null,
	memberOrganizationItem: null as string | null,
	membershipType: '',
	comment: '',
	startDate: '',
	endDate: '',
	endReason: '',
})
const selectedPerson = computed(() => persons.value?.find((person) => person.id === model.memberPerson))

defineExpose({
	create: () => {
		model.memberType = ''
		model.memberPerson = null
		model.memberOrganizationItem = null
		model.membershipType = ''
		model.comment = ''
		model.startDate = ''
		model.endDate = ''
		model.endReason = ''
		currentTask.value = ''
		errorMessage.value = ''
		itemId.value = null
		edited['select-member'] = false
		edited['select-membership-type'] = false
		edited['select-period'] = false
		dialog.value?.showModal()
	},
	edit: async (id: string) => {
		const data = await $fetch(`/api/memberships/${id}`)
		model.memberType = data.memberType
		model.memberPerson = data.memberPerson
		model.memberOrganizationItem = data.memberOrganizationItem
		model.membershipType = data.membershipType
		model.comment = data.comment || ''
		model.startDate = data.startDate?.split('T')[0] || ''
		model.endDate = data.endDate?.split('T')[0] || ''
		model.endReason = data.endReason || ''
		currentTask.value = 'check-data'
		errorMessage.value = ''
		itemId.value = id
		dialog.value?.showModal()
	},
})

const tasks = [
	{
		title: 'Daten der Mitgliedschaft',
		tasks: [
			{
				id: 'select-member',
				label: 'Mitglied auswählen',
			},
			{
				id: 'select-membership-type',
				label: 'Mitgliedschaftsart und Rolle angeben',
			},
			{
				id: 'select-period',
				label: 'Zeitraum der Mitgliedschaft angeben',
			},
		],
	},
	{
		title: 'Zusammenfassung',
		tasks: [
			{
				id: 'check-data',
				label: 'Angaben überprüfen',
			},
		],
	},
]
const _currentTask = ref('')
const currentTask = computed({
	get: () => _currentTask.value,
	set: (value) => {
		if(value) edited[value] = true
		_currentTask.value = value
	},
})
const flatTasks = computed(() => tasks.flatMap((item) => item.tasks))
const currentTaskIndex = computed(() => flatTasks.value.findIndex((task) => task.id === currentTask.value))

type TaskId = (typeof flatTasks.value)[number]['id']
type TaskBooleanRecord = Record<TaskId, boolean>
const valid = computed<TaskBooleanRecord>(() => ({
	'select-member':
		(model.memberType === 'person' && Boolean(model.memberPerson)) ||
		(model.memberType === 'organizationItem' && Boolean(model.memberOrganizationItem)),
	'select-membership-type': Boolean(model.membershipType),
	'select-period': true,
}))
const edited = reactive<TaskBooleanRecord>(Object.fromEntries(flatTasks.value.map((task) => [ task.id, false ])) as any)

const tasksStatus = computed(() => {
	const result = []
	let taskReady = true
	for(const item of tasks) {
		const resultItem = {
			...item,
			tasks: [] as any[],
		}
		for(const task of item.tasks) {
			let status = 'blocked'
			if(taskReady) {
				if(edited[task.id]) {
					if(valid.value[task.id]) {
						status = 'done'
					} else {
						status = task.id === 'check-data' ? 'open' : 'partial'
						taskReady = false
					}
				} else {
					status = 'open'
					taskReady = false
				}
			}
			resultItem.tasks.push({
				...task,
				status,
			})
		}
		result.push(resultItem)
	}
	return result
})

function moveTask(direction: -1 | 1) {
	if(currentTaskIndex.value === -1) return
	const nextIndex = currentTaskIndex.value + direction
	if(nextIndex < 0 || nextIndex >= flatTasks.value.length) return
	currentTask.value = flatTasks.value[nextIndex]!.id
}

const errorMessage = ref('')

function cancel() {
	dialog.value?.close()
}

async function save() {
	const body = Object.fromEntries(Object.entries({
		...model,
		organizationItem: props.organizationItem,
	}).filter(([ , value ]) => value !== null && value !== '').map(([ key, value ]) => [ key, value ]))
	try {
		if(itemId.value) {
			await $fetch(`/api/memberships/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/memberships', {
				method: 'POST',
				body,
			})
		}
		emit('refresh')
		dialog.value?.close()
	} catch(e) {
		if(e instanceof FetchError) {
			errorMessage.value = e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.'
		}
	}
}
</script>

<template lang="pug">
dialog#dialog.kern-dialog(
ref="dialog"
aria-labelledby="dialog_heading")
	header.kern-dialog__header
		h2.kern-title.kern-title--large#dialog_heading Mitgliedschaft {{ itemId ? 'bearbeiten' : 'erstellen' }}
		button.kern-btn.kern-btn--tertiary
			span.kern-icon.kern-icon--close(aria-hidden="true")
			span.kern-sr-only Schließen
	section.kern-dialog__body
		KernTaskList(
			v-if="currentTask === ''"
			:items="tasksStatus"
			@select="currentTask = $event"
		)
		.flex.flex-row.gap-4(v-else-if="currentTask !== 'check-data' || !itemId")
			button.kern-btn.kern-btn--tertiary(
				v-if="!itemId"
				@click="currentTask = ''"
			)
				span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
				span.kern-label.kern-sr-only Zurück
			h2.kern-title.kern-title--medium Schritt {{ currentTaskIndex + 1 }}: {{ flatTasks[currentTaskIndex]?.label }}
		template(v-if="currentTask === 'select-member'")
			.kern-form-input
				label.kern-label(for="memberType") Art des Mitglieds
				select.kern-form-input__input#memberType(
					v-model="model.memberType"
					@change="model.memberPerson = null; model.memberOrganizationItem = null"
				)
					option(value="person") Person
					option(value="organizationItem") Organisationseinheit
			template(v-if="model.memberType === 'person'")
				.kern-form-input(v-if="model.person")
					label.kern-label(for="person") Person
					.flex.flex-row.gap-2.w-full
						input.flex-1.kern-form-input__input#person(
							:value="`${selectedPerson.callName || selectedPerson.firstName} ${selectedPerson.lastName}`"
							readonly
						)
						button.kern-btn.kern-btn--tertiary(@click="model.person = null")
							span.kern-icon.kern-icon--edit(aria-hidden="true")
							span.kern-label.kern-sr-only Neu auswählen
				table.kern-table(v-else)
					caption.kern-title Personensuche
					thead.kern-table__head
						tr.kern-table__row
							td.kern-table__cell(colspan="2")
								.kern-form-input
									label.kern-label(for="search") Suche
									input.kern-form-input__input#search(
										v-model="personFilter"
										type="text"
										placeholder="Nach Name oder E-Mail-Adresse suchen..."
									)
						tr.kern-table__row
							th.kern-table__header(scope="col") Name
							th.kern-table__header(scope="col") Auswahl
					tbody.kern-table__body
						tr.kern-table__row(v-if="data?.length === 0")
							td.kern-table__cell(colspan="2") Keine Einträge gefunden.
						tr.kern-table__row(
							v-for="person of filteredPersons"
							:key="person.id"
						)
							td.kern-table__cell {{ person.callName || person.firstName }} {{ person.lastName }}
							td.kern-table__cell
								button.kern-btn.kern-btn--tertiary(@click="model.memberPerson = person.id")
									span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
									span.kern-label.kern-sr-only Auswählen
			.kern-form-input(v-if="model.memberType === 'organizationItem'")
				label.kern-label(for="organizationItem") Organisationseinheit
				OrganizationItemSelect#organizationItem(v-model="model.memberOrganizationItem")
		template(v-if="currentTask === 'select-membership-type'")
			.kern-form-input
				label.kern-label(for="membershipType") Mitgliedschaftsart
				MembershipTypeSelect#membershipType(v-model="model.membershipType")
			.kern-form-input
				label.kern-label(for="comment") Besondere Rolle #[span.kern-label__optional - Optional]
				input.kern-form-input__input#comment(
					v-model="model.comment"
					type="text"
				)
		template(v-if="currentTask === 'select-period'")
			fieldset.kern-fieldset
				legend.kern-label Beginn der Mitgliedschaft #[span.kern-label__optional - Optional]
				KernDateInput#startDate(
					v-model="model.startDate"
					show-time
				)
			fieldset.kern-fieldset
				legend.kern-label Ende der Mitgliedschaft #[span.kern-label__optional - Optional]
				KernDateInput#endDate(
					v-model="model.endDate"
					show-time
				)
			.kern-form-input
				label.kern-label(for="endReason") Grund des Ausscheidens #[span.kern-label__optional - Optional]
				select.kern-form-input__input#endReason(v-model="model.endReason")
					option(
						v-for="item of membershipEndReasons"
						:key="item.id"
						:value="item.id"
					) {{ item.name }} ({{ item.code }})
		template(v-if="currentTask === 'check-data'")
			.kern-summary-group.w-full
				.kern-summary
					.kern-summary__header
						span.kern-number 1
						h3.kern-title.kern-title--small Angaben zum Mitglied
					.kern-summary__body
						dl.kern-description-list
							.kern-description-list-item
								dt.kern-description-list-item__key Art des Mitglieds
								dd.kern-description-list-item__value {{ model.memberType === 'person' ? 'Person' : 'Organisationseinheit' }}
							.kern-description-list-item
								dt.kern-description-list-item__key Mitglied
								dd.kern-description-list-item__value
									template(v-if="model.memberType === 'person' && selectedPerson")
										| {{ selectedPerson.callName || selectedPerson.firstName }} {{ selectedPerson.lastName }}
									template(v-else-if="model.memberType === 'organizationItem'")
										| {{ organizationItems.find(item => item.id === model.memberOrganizationItem)?.name }}
									template(v-else)
										em unbekannt
						.kern-summary__actions
							a.kern-link(
								href="#"
								aria-describedby="title"
								@click.prevent="currentTask = 'select-member'"
							)
								span.kern-icon.kern-icon--edit(aria-hidden="true")
								| Bearbeiten
				.kern-summary
					.kern-summary__header
						span.kern-number 2
						h3.kern-title.kern-title--small Angaben zur Mitgliedschaftsart
					.kern-summary__body
						dl.kern-description-list
							.kern-description-list-item
								dt.kern-description-list-item__key Mitgliedschaftsart
								dd.kern-description-list-item__value {{ membershipTypes.find(item => item.id === model.membershipType)?.name }}
							.kern-description-list-item(v-if="model.comment")
								dt.kern-description-list-item__key Besondere Rolle
								dd.kern-description-list-item__value {{ model.comment }}
						.kern-summary__actions
							a.kern-link(
								href="#"
								aria-describedby="title"
								@click.prevent="currentTask = 'select-membership-type'"
							)
								span.kern-icon.kern-icon--edit(aria-hidden="true")
								| Bearbeiten
				.kern-summary
					.kern-summary__header
						span.kern-number 3
						h3.kern-title.kern-title--small Angaben zur Dauer der Mitgliedschaft
					.kern-summary__body
						dl.kern-description-list(v-if="model.startDate || model.endDate || model.endReason")
							.kern-description-list-item(v-if="model.startDate")
								dt.kern-description-list-item__key Beginn der Mitgliedschaft
								dd.kern-description-list-item__value {{ formatDate(model.startDate) }}
							.kern-description-list-item(v-if="model.endDate")
								dt.kern-description-list-item__key Ende der Mitgliedschaft
								dd.kern-description-list-item__value {{ formatDate(model.endDate) }}
							.kern-description-list-item(v-if="model.endReason")
								dt.kern-description-list-item__key Ausgeschieden durch
								dd.kern-description-list-item__value {{ membershipEndReasons.find(item => item.id === model.endReason)?.name }}
						p.kern-body(v-else) Keine Angaben
						.kern-summary__actions
							a.kern-link(
								href="#"
								aria-describedby="title"
								@click.prevent="currentTask = 'select-period'"
							)
								span.kern-icon.kern-icon--edit(aria-hidden="true")
								| Bearbeiten
		.kern-alert.kern-alert--danger(
			v-if="errorMessage"
			role="alert"
		)
			.kern-alert__header
				span.kern-icon.kern-icon--danger(aria-hidden="true")
				span.kern-title Fehler bei der {{ itemId ? 'Bearbeitung' : 'Erstellung' }}
			.kern-alert__body
				p.kern-body {{ errorMessage }}
	footer.kern-dialog__footer(v-if="currentTask")
		template(v-if="currentTask === 'check-data'")
			button.kern-btn.kern-btn--secondary(@click="cancel()")
				span.kern-label Abbrechen
			button.kern-btn.kern-btn--primary(@click="save()")
				span.kern-label Speichern
		template(v-else-if="itemId")
			button.kern-btn.kern-btn--primary(@click="currentTask = 'check-data'")
				span.kern-label Übernehmen
		template(v-else)
			button.kern-btn.kern-btn--secondary(
				v-if="currentTask !== 'select-member'"
				@click="moveTask(-1)"
			)
				span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
				span.kern-label Zurück
			button.kern-btn.kern-btn--primary(
				:disabled="!valid[currentTask]"
				@click="moveTask(1)"
			)
				span.kern-label Weiter
				span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
</template>

<style scoped>
#dialog {
	width: 100%;
}

@media (min-width: 50rem) {
	#dialog {
		width: 50rem;
	}
}
</style>
