<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	status: 'pending' | 'completed' | 'failed'
	comment: string | null
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

const step = ref<{
	type: 'comment' | 'approval' | 'task'
} | null>(null)

function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = structuredClone(data)
	model.value = structuredClone(data)
	step.value = data.step
	dialog.value.show()
}

defineExpose({
	async open(id: string) {
		const item = await $fetch(`/api/processSteps/${id}`)
		openDialog(id, item)
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
	if(!dialog.value) return
	try {
		await $fetch(`/api/processSteps/${itemId.value}`, {
			method: 'PUT',
			body: model.value,
		})
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: 'Fehler bei der Bearbeitung',
				text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	title="Prozessschritt bearbeiten"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model && step")
		ProcessStepStatusInput(
			v-model="model.status"
			:type="step.type"
		)
		ProcessStepCommentInput(v-model="model.comment")
</template>
