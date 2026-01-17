<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'
import type { Person } from '~/types'

const props = defineProps<{
	electionProposal: string
	readonly?: boolean
}>()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	candidate: Person
	applicationLetter: string | null
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
			candidate: null,
			applicationLetter: null,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/candidates/${id}`)
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
	if(!dialog.value || !model.value) return
	try {
		const body = {
			electionProposal: props.electionProposal,
			candidate: model.value.candidate?.id,
			applicationLetter: model.value.applicationLetter,
		}
		if(itemId.value) {
			await $fetch(`/api/candidates/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/candidates', {
				method: 'POST',
				body,
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
	:title="`Kandidatur ${props.readonly ? 'anzeigen' : itemId ? 'bearbeiten' : 'erstellen'}`"
	:modal="modified"
	:readonly="props.readonly"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		CandidateCandidateInput(
			v-model="model.candidate"
			:readonly="props.readonly"
		)
		CandidateApplicationLetterInput(
			v-model="model.applicationLetter"
			:readonly="props.readonly"
		)
</template>
