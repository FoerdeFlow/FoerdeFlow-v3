<script setup lang="ts">
import type { KernDialog, KernTaskList } from '#components'
import type { KernTaskListItems } from '~/types'

const props = defineProps<{
	title: string
	readonly?: boolean
	sections: {
		title: string
		tasks: {
			id: string
			label: string
			status: 'valid' | 'invalid'
			model: {
				label: string
				value: string | null
			}[]
		}[]
	}[]
}>()

const emit = defineEmits<{
	save: [],
}>()

const dialog = useTemplateRef<typeof KernTaskList>('dialog')

const tasks = computed(() => props.sections.flatMap((section) => section.tasks))

const currentView = ref<'task-list' | 'task-detail' | 'check-data'>('task-list')
const currentTaskIndex = ref<number>(-1)
const currentTask = computed(() => tasks.value[currentTaskIndex.value])
const currentTaskId = computed({
	get: () => currentTask.value?.id ?? null,
	set: (id) => {
		const idx = tasks.value.findIndex((task) => task.id === id)
		if(idx >= 0) {
			currentTaskIndex.value = idx
		}
	},
})

const taskDetail = useTemplateRef<HTMLElement>('task-detail')
watch([ currentView, currentTaskIndex ], async () => {
	await nextTick()
	if(!taskDetail.value) return
	const formInput: HTMLElement | null = taskDetail.value.querySelector('a, input, select, textarea')
	if(formInput) {
		formInput.focus()
	}
}, { immediate: true })

const visited = ref<Record<string, true>>({})
watch(currentTaskId, (id) => {
	if(id) {
		visited.value[id] = true
	}
}, { immediate: true })

const workItems = computed(() => props.sections.map((section) => ({
	title: section.title,
	tasks: section.tasks.reduce<KernTaskListItems[number]['tasks']>((tasks, task) => ([
		...tasks,
		{
			id: task.id,
			label: task.label,
			status: !tasks.every(({ status }) => status === 'done')
				? 'blocked' as const
				: !visited.value[task.id]
					? 'open' as const
					: task.status === 'invalid'
						? 'partial' as const
						: 'done' as const,
		},
	]), []),
})))
const items = computed(() => [
	...workItems.value,
	{
		title: 'Zusammenfassung',
		tasks: [
			{
				id: 'check-data',
				label: 'Angaben überprüfen',
				status: workItems.value.every((section) =>
					section.tasks.every((task) => task.status === 'done'),
				)
					? 'open'
					: 'blocked',
			},
		],
	},
] satisfies KernTaskListItems)

const creationCheck = ref(false)
const initialMode = ref<'create' | 'edit'>('create')
const mode = computed(() => initialMode.value === 'create' && !creationCheck.value ? 'create' : 'edit')

function moveTask(offset: -1 | 1) {
	const nextIndex = currentTaskIndex.value + offset
	if(nextIndex === tasks.value.length) {
		currentView.value = 'check-data'
		creationCheck.value = true
		return
	}
	if(nextIndex < 0 || nextIndex >= tasks.value.length) return
	currentTaskIndex.value = nextIndex
}

function openTask(task: string) {
	if(task === 'check-data') {
		currentView.value = 'check-data'
		creationCheck.value = true
		return
	}
	currentTaskId.value = task
	currentView.value = 'task-detail'
}

function cancel() {
	dialog.value?.hide()
}

defineExpose({
	show(displayMode: 'create' | 'edit') {
		if(!dialog.value) return
		currentView.value = displayMode === 'edit' ? 'check-data' : 'task-list'
		initialMode.value = displayMode
		creationCheck.value = false
		visited.value = {}
		dialog.value.show()
	},
	hide() {
		if(!dialog.value) return
		dialog.value.hide()
	},
	showAlert: (props: InstanceType<typeof KernDialog>['$props']) => {
		if(!dialog.value) return
		dialog.value.showAlert(props)
	},
})
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="`${props.title} ${initialMode === 'edit' ? 'bearbeiten' : 'erstellen'}`"
)
	template(#default)
		template(v-if="currentView === 'task-list'")
			KernTaskList(
				:items="items"
				@select="openTask"
			)
		template(v-if="currentView === 'task-detail' && currentTask")
			.flex.flex-row.gap-4
				button.kern-btn.kern-btn--tertiary(
					v-if="mode === 'create'"
					@click="currentView = 'task-list'"
				)
					span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
					span.kern-label.kern-sr-only Zurück
				h2.kern-title.kern-title--medium Schritt {{ currentTaskIndex + 1 }}: {{ currentTask.label }}
			div(ref="task-detail")
				slot(:name="`task-${currentTaskId}`")
		template(v-if="currentView === 'check-data'")
			.flex.flex-row.gap-4
				button.kern-btn.kern-btn--tertiary(
					v-if="mode === 'create'"
					@click="currentView = 'task-list'"
				)
					span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
					span.kern-label.kern-sr-only Zurück
				h2.kern-title.kern-title--medium Angaben überprüfen
			.kern-summary-group.w-full(ref="task-detail")
				.kern-summary(
					v-for="(task, idx) of tasks"
					:key="idx"
				)
					.kern-summary__header
						span.kern-number {{ idx + 1 }}
						h3.kern-title.kern-title--small {{ task.label }}
					.kern-summary__body
						dl.kern-description-list(v-if="task.model.filter(({ value }) => value !== null).length > 0")
							.kern-description-list-item(
								v-for="({ label, value }, subidx) of task.model"
								:key="subidx"
							)
								dt.kern-description-list-item__key {{ label }}
								dd.kern-description-list-item__value
									template(v-if="value !== null") {{ value }}
									template(v-else) #[em unbekannt]
						p.kern-body(v-else) Keine Angaben
						.kern-summary__actions(v-if="!props.readonly")
							a.kern-link(
								href="#"
								aria-describedby="title"
								@click.prevent="openTask(task.id)"
							)
								span.kern-icon.kern-icon--edit(aria-hidden="true")
								| Bearbeiten
	template(#actions)
		template(v-if="currentView === 'check-data'")
			template(v-if="props.readonly")
				button.kern-btn.kern-btn--primary(@click="cancel()")
					span.kern-icon.kern-icon--close(aria-hidden="true")
					span.kern-label Schließen
			template(v-else)
				button.kern-btn.kern-btn--secondary(@click="cancel()")
					span.kern-icon.kern-icon--close(aria-hidden="true")
					span.kern-label Abbrechen
				button.kern-btn.kern-btn--primary(@click="emit('save')")
					span.kern-icon.kern-icon--check(aria-hidden="true")
					span.kern-label Speichern
		template(v-else-if="currentView === 'task-detail' && currentTask")
			template(v-if="mode === 'create'")
				button.kern-btn.kern-btn--secondary(
					v-if="currentTaskIndex > 0"
					@click="moveTask(-1)"
				)
					span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
					span.kern-label Zurück
				button.kern-btn.kern-btn--primary(
					:disabled="currentTask.status === 'invalid'"
					@click="moveTask(1)"
				)
					span.kern-label Weiter
					span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			template(v-if="mode === 'edit'")
				button.kern-btn.kern-btn--primary(@click="currentView = 'check-data'")
					span.kern-label Übernehmen
		template(v-else)
			//- Nothing, but remove the default slot
			| &nbsp;
</template>
