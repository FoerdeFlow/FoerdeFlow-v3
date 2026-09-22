<script setup lang="ts">
import { FetchError } from 'ofetch'

import { KernDialog } from '#components'

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
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
		openDialog(null, { name: '' })
	},
	async edit(id: string) {
		const item = await $fetch(`/api/calendarTokens/${id}`)
		openDialog(id, { name: item.name })
	},
})

const emit = defineEmits<{
	refresh: []
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

const valid = computed(() => Boolean(model.value?.name))

async function save() {
	if(!dialog.value || !model.value) return
	try {
		if(itemId.value) {
			await $fetch(`/api/calendarTokens/${itemId.value}`, {
				method: 'PUT',
				body: model.value,
			})
		} else {
			await $fetch('/api/calendarTokens', {
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
					? t('calendarToken.edit.error.title')
					: t('calendarToken.create.error.title'),
				text: e.data?.message ?? (itemId.value
					? t('calendarToken.edit.error.message')
					: t('calendarToken.create.error.message')
				),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('calendarToken.edit.title') : $t('calendarToken.create.title')"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		CalendarTokenNameInput(v-model="model.name")
</template>
