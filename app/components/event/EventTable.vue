<script setup lang="ts">
import type { CalendarEvent, Scope } from '~/types'

const props = defineProps<{
	caption: string
	data: CalendarEvent[]
	groups: {
		key: string
		label: string
		includes: (item: CalendarEvent) => boolean
		muted?: boolean
	}[]
	allowCreate?: boolean
	scope: Scope
}>()

const emit = defineEmits<{
	create: []
	edit: [CalendarEvent]
	remove: [CalendarEvent]
}>()

const route = useRoute('organizationItems-organizationItem-events')
const { t } = useI18n()

/*
 * Ein Termin, der heute beginnt, heißt „Heute“; einer, der früher begonnen hat
 * und noch andauert, „Läuft“.
 */
function badge(item: CalendarEvent) {
	const now = new Date()
	if(getEventDays(item).first === getDayNumber(now)) return t('event.badge.today')
	if(getEventStatus(item, now) === 'running') return t('event.badge.running')
	return null
}
</script>

<template lang="pug">
KernTable(
	:caption="props.caption"
	:create-permission="props.allowCreate ? 'events.create' : null"
	update-permission="events.update"
	delete-permission="events.delete"
	show-actions
	:columns="[ 'timespan', 'title', 'location' ]"
	:data="props.data"
	:groups="props.groups"
	:scope="props.scope"
	@create="emit('create')"
	@edit="emit('edit', $event)"
	@remove="emit('remove', $event)"
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
		span.kern-badge.kern-badge--info.ml-2(v-if="!item.cancelled && badge(item)") {{ badge(item) }}
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
</template>
