<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'
import type { Session } from '~/types'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)
const organizationItemId = ref<string>('')

interface Model {
	session: Session
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
	async open(id: string, organizationItem: string) {
		const item = await $fetch(`/api/processSteps/${id}`)
		organizationItemId.value = organizationItem
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
	const body = {
		session: model.value?.session?.id,
	}
	try {
		await $fetch(`/api/processSteps/${itemId.value}/transferToOpenslides`, {
			method: 'POST',
			body,
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
	title="Als Antrag in OpenSlides übertragen"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		ProcessStepConnectionSessionInput(
			v-model="model.session"
			:organization-item="organizationItemId"
		)
</template>
