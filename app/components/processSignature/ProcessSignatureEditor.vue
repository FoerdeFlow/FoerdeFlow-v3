<script setup lang="ts">
import { FetchError } from 'ofetch'

import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	status: 'pending' | 'received'
	comment: string | null
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

const signature = ref<{
	name: string
} | null>(null)

function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = structuredClone(data)
	model.value = structuredClone(data)
	dialog.value.show()
}

defineExpose({
	async open(id: string) {
		const item = await $fetch(`/api/processSignatures/${id}`)
		signature.value = item.signature
		openDialog(id, {
			status: item.status,
			comment: item.comment,
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
	if(!dialog.value) return
	try {
		await $fetch(`/api/processSignatures/${itemId.value}`, {
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
	title="Unterschrifteneingang bestätigen"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model && signature")
		p.kern-body {{ signature.name }}
		ProcessSignatureStatusInput(v-model="model.status")
		ProcessSignatureCommentInput(v-model="model.comment")
</template>
