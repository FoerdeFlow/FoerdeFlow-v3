<script setup lang="ts">
import { FetchError } from 'ofetch'

import { KernDialog } from '#components'

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	code: string
	name: string
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
			code: '',
			name: '',
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/eventTypes/${id}`)
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
		if(itemId.value) {
			await $fetch(`/api/eventTypes/${itemId.value}`, {
				method: 'PUT',
				body: model.value,
			})
		} else {
			await $fetch('/api/eventTypes', {
				method: 'POST',
				body: model.value,
			})
		}
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: itemId.value
					? t('eventType.edit.error.title')
					: t('eventType.create.error.title'),
				text: e.data?.message ?? (itemId.value
					? t('eventType.edit.error.message')
					: t('eventType.create.error.message')
				),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('eventType.edit.title') : $t('eventType.create.title')"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		EventTypeCodeInput(v-model="model.code")
		EventTypeNameInput(v-model="model.name")
</template>
