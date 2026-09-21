<script setup lang="ts">
import { FetchError } from 'ofetch'

import { EventTypeEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()
const { t } = useI18n()

const { data, refresh } = useFetch('/api/eventTypes')

const editor = useTemplateRef<typeof EventTypeEditor>('editor')

function create() {
	if(!editor.value) return
	editor.value.create()
}

function edit({ id }: { id: string }) {
	if(!editor.value) return
	editor.value.edit(id)
}

async function remove({ id }: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: t('eventType.remove.title'),
		text: t('eventType.remove.text'),
	})) {
		try {
			await $fetch(`/api/eventTypes/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: t('eventType.remove.error.title'),
					text: e.data?.message ?? t('eventType.remove.error.message'),
				})
			}
		}
	}
}
</script>

<template lang="pug">
h1.kern-heading-large {{ $t('eventType.title') }}
KernTable(
	:caption="$t('eventType.table.caption')"
	create-permission="eventTypes.create"
	update-permission="eventTypes.update"
	delete-permission="eventTypes.delete"
	:columns="[ 'name' ]"
	:data="data ?? []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| {{ $t('eventType.field.name') }}
	template(#name-body="{ item }")
		| {{ formatEventType(item) }}
EventTypeEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
