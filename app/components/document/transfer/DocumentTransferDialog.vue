<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { KernDialog } from '#components'
import type { Session } from '~/types'

const itemId = ref<string | null>(null)
const model = ref<{
	session: Session
}>({
	session: null,
})
const dialog = useTemplateRef<typeof KernDialog>('dialog')

defineExpose({
	async transfer(id: string) {
		if(!dialog.value) return
		itemId.value = id
		await nextTick()
		dialog.value.show()
	},
})

const props = defineProps<{
	organizationItem: string
}>()

const emit = defineEmits<{
	refresh: [],
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

async function save() {
	if(!dialog.value) return
	try {
		await $fetch(`/api/documents/${itemId.value}/transferToOpenslides`, {
			method: 'POST',
			body: {
				session: model.value.session?.id,
			},
		})
		emit('refresh')
		dialog.value.hide()
		itemId.value = null
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: 'Fehler bei der Übertragung',
				text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	title="Dokument der Vorlage bearbeiten"
	:modal="true"
	@cancel="cancel"
	@save="save"
)
	template(v-if="itemId")
		DocumentTransferSessionInput(
			v-model="model.session"
			:organization-item="props.organizationItem"
		)
</template>
