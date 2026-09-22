<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { EventEditor } from '#components'

const route = useRoute('organizationItems-organizationItem-events')
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const { t } = useI18n()

const { data, refresh } = useFetch('/api/events', {
	query: { organizationItem: route.params.organizationItem },
	default: () => [],
})

const dialog = useTemplateRef<typeof EventEditor>('dialog')

function create() {
	if(!dialog.value) return
	dialog.value.create()
}

function edit({ id }: { id: string }) {
	if(!dialog.value) return
	dialog.value.edit(id)
}

async function remove({ id }: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: t('event.remove.title'),
		text: t('event.remove.text'),
	})) {
		try {
			await $fetch(`/api/events/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: t('event.remove.error.title'),
					text: e.data?.message ?? t('event.remove.error.message'),
				})
			}
		}
	}
}

const scope = computed(() => ({
	organizationItem: route.params.organizationItem,
}))
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to=`{
			name: 'organizationItems-organizationItem',
			params: { organizationItem: route.params.organizationItem },
		}`
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zum Gremium
h1.kern-heading-large {{ $t('event.title') }}
KernTable(
	:caption="$t('event.table.caption')"
	create-permission="events.create"
	update-permission="events.update"
	delete-permission="events.delete"
	show-actions
	:columns="[ 'timespan', 'title', 'location' ]"
	:data="data"
	:scope="scope"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#timespan-header)
		| {{ $t('event.field.timespan') }}
	template(#timespan-body="{ item }")
		| {{ formatEventTimespan(item) }}
	template(#title-header)
		| {{ $t('event.field.title') }}
	template(#title-body="{ item }")
		p.kern-preline {{ formatEventType(item.type) }}
		span {{ item.title }}
		span.kern-badge.kern-badge--danger.ml-2(v-if="item.cancelled") {{ $t('event.cancelled.badge') }}
	template(#location-header)
		| {{ $t('event.field.location') }}
	template(#location-body="{ item }")
		| {{ item.location ? formatLocation(item.location) : $t('event.field.locationOpen') }}
		template(v-if="item.onlineLocation")
			br
			| {{ formatLocation(item.onlineLocation) }}
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to=`{
				name: 'organizationItems-organizationItem-events-event',
				params: { organizationItem: route.params.organizationItem, event: item.id },
			}`
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
EventEditor(
	ref="dialog"
	:organization-item="route.params.organizationItem"
	@refresh="refresh"
)
</template>
