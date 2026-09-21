<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { EventEditor } from '#components'

const route = useRoute('organizationItems-organizationItem-events-event')
const authStore = useAuthStore()
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const { t } = useI18n()

const { data, refresh } = useFetch(() => `/api/events/${route.params.event}`, {
	default: () => ({
		title: '',
		description: null,
		type: null,
		allDay: false,
		startDate: '',
		endDate: null,
		room: null,
		cancelled: false,
		organizationItem: null,
	}),
})

const dialog = useTemplateRef<typeof EventEditor>('dialog')

const updateAllowed = authStore.hasPermission('events.update', { organizationItem: route.params.organizationItem })
const deleteAllowed = authStore.hasPermission('events.delete', { organizationItem: route.params.organizationItem })

const items = computed(() => [
	{ key: t('event.field.organizationItem'), value: formatOrganizationItem(data.value.organizationItem) },
	{ key: t('event.field.type'), value: formatEventType(data.value.type) },
	{ key: t('event.field.timespan'), value: formatEventTimespan(data.value) },
	{ key: t('event.field.room'), value: formatRoom(data.value.room) },
])

function edit() {
	if(!dialog.value) return
	dialog.value.edit(route.params.event)
}

/**
 * Calls the event off, or lets it take place again. Sends the whole event back,
 * because the update route takes nothing less.
 */
async function toggleCancelled() {
	const target = !data.value.cancelled
	const texts = target ? 'event.cancelled.cancel' : 'event.cancelled.revoke'
	if(!await confirmDialogStore.askConfirm({
		title: t(`${texts}.title`),
		text: t(`${texts}.text`),
	})) return
	try {
		await $fetch(`/api/events/${route.params.event}`, {
			method: 'PUT',
			body: {
				title: data.value.title,
				description: data.value.description,
				type: data.value.type?.id ?? null,
				allDay: data.value.allDay,
				startDate: data.value.startDate,
				endDate: data.value.endDate,
				room: data.value.room?.id ?? null,
				cancelled: target,
			},
		})
		await refresh()
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			alertStore.showAlert({
				type: 'danger',
				title: t('event.cancelled.error.title'),
				text: e.data?.message ?? t('event.cancelled.error.message'),
			})
		}
	}
}

async function remove() {
	if(!await confirmDialogStore.askConfirm({
		title: t('event.remove.title'),
		text: t('event.remove.text'),
	})) return
	try {
		await $fetch(`/api/events/${route.params.event}`, { method: 'DELETE' })
		await navigateTo({
			name: 'organizationItems-organizationItem-events',
			params: { organizationItem: route.params.organizationItem },
		})
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
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to=`{
			name: 'organizationItems-organizationItem-events',
			params: { organizationItem: route.params.organizationItem },
		}`
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Veranstaltungsübersicht
header
	p.kern-preline {{ formatEventType(data.type) }}
	h1.kern-heading-large {{ data.title }}
KernAlert(
	v-if="data.cancelled"
	type="warning"
	:title="$t('event.cancelled.alert.title')"
	:text="$t('event.cancelled.alert.text')"
	:dismissible="false"
)
dl.kern-description-list
	.kern-description-list-item(
		v-for="item of items"
		:key="item.key"
	)
		dt.kern-description-list-item__key {{ item.key }}
		dd.kern-description-list-item__value {{ item.value }}
	.kern-description-list-item(v-if="data.allDay")
		dt.kern-description-list-item__key {{ $t('event.input.allDay.label') }}
		dd.kern-description-list-item__value {{ $t('event.allDay.yes') }}
section.mb-8(v-if="data.description")
	h2.kern-title {{ $t('event.field.description') }}
	KernText(:text="data.description")
.kern-btn-wrapper
	button.kern-btn.kern-btn--secondary(
		v-if="updateAllowed"
		@click="edit"
	)
		span.kern-icon.kern-icon--edit(aria-hidden="true")
		span.kern-label Bearbeiten
	button.kern-btn.kern-btn--secondary(
		v-if="updateAllowed"
		@click="toggleCancelled"
	)
		span.kern-icon(
			aria-hidden="true"
			:class="data.cancelled ? 'kern-icon--check' : 'kern-icon--close'"
		)
		span.kern-label {{ data.cancelled ? $t('event.cancelled.revoke.action') : $t('event.cancelled.cancel.action') }}
	button.kern-btn.kern-btn--secondary(
		v-if="deleteAllowed"
		@click="remove"
	)
		span.kern-icon.kern-icon--delete(aria-hidden="true")
		span.kern-label Löschen
EventEditor(
	ref="dialog"
	:organization-item="route.params.organizationItem"
	@refresh="refresh"
)
</template>
