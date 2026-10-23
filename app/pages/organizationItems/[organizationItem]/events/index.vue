<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { EventEditor } from '#components'
import type { EventType } from '~/types'

const route = useRoute('organizationItems-organizationItem-events')
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const { t } = useI18n()

const { data, refresh } = useFetch('/api/events', {
	query: { organizationItem: route.params.organizationItem },
	default: () => [],
})

const searchId = useId()
const typeId = useId()
const fromId = useId()
const toId = useId()

const search = ref('')
const type = ref<EventType>(null)
const from = ref('')
const to = ref('')

const filterActive = computed(() => [ search.value, type.value, from.value, to.value ].some(Boolean))

function resetFilter() {
	search.value = ''
	type.value = null
	from.value = ''
	to.value = ''
}

/*
 * Jedes Wort der Suche muss in einem der Felder vorkommen, wie bei der
 * Personensuche. Der Zeitraum nimmt jeden Termin auf, der ihn an einem Tag
 * berührt.
 */
const filtered = computed(() => {
	const words = search.value.toLocaleLowerCase('de').split(/\s+/).filter(Boolean)
	const first = from.value ? getDayNumber(from.value) : -Infinity
	const last = to.value ? getDayNumber(to.value) : Infinity
	return data.value.filter((event) => {
		if(type.value && event.type.id !== type.value.id) return false
		const days = getEventDays(event)
		if(days.first > last || days.last < first) return false
		const text = [
			event.title,
			event.description,
			formatEventType(event.type),
			formatLocation(event.location),
			formatLocation(event.onlineLocation),
		].join('\n').toLocaleLowerCase('de')
		return words.every((word) => text.includes(word))
	})
})

const grouped = useEventGroups(filtered)

// Liegt der gewählte Zeitraum ganz in der Vergangenheit, stehen die Treffer
// sonst unsichtbar im eingeklappten Abschnitt.
const pastOpen = computed(() =>
	filterActive.value && grouped.value.current.items.length === 0 && grouped.value.past.items.length > 0)

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
.ff3-event-filter.mb-8
	.kern-form-input
		label.kern-label(:for="searchId") {{ $t('event.filter.search') }}
		.flex.flex-row.gap-2.w-full
			input.flex-1.kern-form-input__input(
				:id="searchId"
				v-model="search"
				type="text"
				:placeholder="$t('event.filter.searchPlaceholder')"
			)
			button.kern-btn.kern-btn--tertiary(
				v-if="search"
				@click="search = ''"
			)
				span.kern-icon.kern-icon--close(aria-hidden="true")
				span.kern-label.kern-sr-only {{ $t('event.filter.searchReset') }}
	.kern-form-input
		label.kern-label(:for="typeId") {{ $t('event.field.type') }}
		EventTypeSelect(
			:id="typeId"
			v-model="type"
			:empty-label="$t('event.filter.allTypes')"
		)
	.kern-form-input
		label.kern-label(:for="fromId") {{ $t('event.filter.from') }}
		input.kern-form-input__input(
			:id="fromId"
			v-model="from"
			type="date"
		)
	.kern-form-input
		label.kern-label(:for="toId") {{ $t('event.filter.to') }}
		input.kern-form-input__input(
			:id="toId"
			v-model="to"
			type="date"
		)
	button.kern-btn.kern-btn--secondary.self-end(
		v-if="filterActive"
		type="button"
		@click="resetFilter()"
	)
		span.kern-icon.kern-icon--close(aria-hidden="true")
		span.kern-label {{ $t('event.filter.reset') }}
EventTable(
	:caption="$t('event.table.caption')"
	:data="grouped.current.items"
	:groups="grouped.current.groups"
	:scope="scope"
	allow-create
	@create="create"
	@edit="edit"
	@remove="remove"
)
details.mt-4(
	v-if="grouped.past.items.length > 0"
	:open="pastOpen"
)
	summary.kern-title {{ $t('event.past.summary', { count: grouped.past.items.length }) }}
	EventTable(
		:caption="$t('event.past.caption')"
		:data="grouped.past.items"
		:groups="grouped.past.groups"
		:scope="scope"
		@edit="edit"
		@remove="remove"
	)
EventEditor(
	ref="dialog"
	:organization-item="route.params.organizationItem"
	@refresh="refresh"
)
</template>

<style scoped>
.ff3-event-filter {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
	gap: 1rem;
}
</style>
