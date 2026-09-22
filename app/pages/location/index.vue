<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { LocationEditor, LocationMergeDialog } from '#components'

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const authStore = useAuthStore()
const { t } = useI18n()

const { data, refresh } = useFetch('/api/locations')

const editor = useTemplateRef<InstanceType<typeof LocationEditor>>('editor')
const merger = useTemplateRef<InstanceType<typeof LocationMergeDialog>>('merger')

// Die noch nicht geprüften Orte stehen oben, weil sie die Arbeit sind.
const typeOrder = [ 'adHoc', 'building', 'room', 'place', 'external', 'online' ]
const items = computed(() => [ ...data.value ?? [] ].sort((a, b) =>
	typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) ||
	formatLocation(a).localeCompare(formatLocation(b)),
))

const mergeAllowed = authStore.hasPermission('locations.update')

function create() {
	if(!editor.value) return
	editor.value.create()
}

function edit({ id }: { id: string }) {
	if(!editor.value) return
	editor.value.edit(id)
}

function merge({ id }: { id: string }) {
	if(!merger.value) return
	merger.value.merge(id)
}

async function remove({ id }: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: t('location.remove.title'),
		text: t('location.remove.text'),
	})) {
		try {
			await $fetch(`/api/locations/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: t('location.remove.error.title'),
					text: e.data?.message ?? t('location.remove.error.message'),
				})
			}
		}
	}
}
</script>

<template lang="pug">
h1.kern-heading-large {{ $t('location.title') }}
KernTable(
	:caption="$t('location.table.caption')"
	:columns="[ 'type', 'name' ]"
	create-permission="locations.create"
	update-permission="locations.update"
	delete-permission="locations.delete"
	:data="items"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#type-header)
		| {{ $t('location.field.type') }}
	template(#type-body="{ item }")
		| {{ $t(`location.type.${item.type}`) }}
	template(#name-header)
		| {{ $t('location.field.name') }}
	template(#name-body="{ item }")
		| {{ formatLocation(item) }}
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			v-if="mergeAllowed"
			:title="$t('location.merge.action')"
			@click="merge(item)"
		)
			span.kern-icon.kern-icon--autorenew(aria-hidden="true")
			span.kern-label.kern-sr-only {{ $t('location.merge.action') }}
LocationEditor(
	ref="editor"
	@refresh="refresh()"
)
LocationMergeDialog(
	ref="merger"
	@refresh="refresh()"
)
</template>
