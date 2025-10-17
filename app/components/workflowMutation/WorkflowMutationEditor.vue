<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'

const props = defineProps<{
	workflow: string
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	table: string
	action: string
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = structuredClone(data)
	model.value = structuredClone(data)
	dialog.value.show()
}

defineExpose({
	create() {
		openDialog(null, {
			table: '',
			action: '',
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/workflowMutations/${id}`)
		openDialog(id, {
			table: item.table,
			action: item.action,
		})
	},
})

const emit = defineEmits<{
	refresh: []
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

async function save() {
	if(!dialog.value || !model.value) return
	try {
		const body = {
			table: model.value.table,
			action: model.value.action,
		}
		if(itemId.value) {
			await $fetch(`/api/workflowMutations/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/workflowMutations', {
				method: 'POST',
				body: {
					...body,
					workflow: props.workflow,
				},
			})
		}
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: `Fehler bei der ${itemId.value ? 'Bearbeitung' : 'Erstellung'}`,
				text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="`Workflow-Mutation ${itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		WorkflowMutationTableInput(v-model="model.table")
		WorkflowMutationActionInput(v-model="model.action")
</template>
