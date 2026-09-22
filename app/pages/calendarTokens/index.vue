<script setup lang="ts">
import { FetchError } from 'ofetch'

import { CalendarTokenEditor } from '#components'

const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()
const { t } = useI18n()

const { data, refresh } = useFetch('/api/calendarTokens', {
	default: () => [],
})

const editor = useTemplateRef<typeof CalendarTokenEditor>('editor')

// Der Abo-Link muss absolut sein, damit er sich in ein Kalenderprogramm
// einfügen lässt. Die Endung `.ics` nimmt der Endpunkt entgegen und verwirft sie.
const requestUrl = useRequestURL()
function subscriptionUrl(token: string) {
	return `${requestUrl.origin}/api/calendar/${token}.ics`
}

const copied = ref<string | null>(null)

async function copy(token: string) {
	try {
		await navigator.clipboard.writeText(subscriptionUrl(token))
		copied.value = token
	} catch(_) {
		alertStore.showAlert({
			type: 'danger',
			title: t('calendarToken.copy.action'),
			text: t('calendarToken.copy.error'),
		})
	}
}

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
		title: t('calendarToken.remove.title'),
		text: t('calendarToken.remove.text'),
	})) {
		try {
			await $fetch(`/api/calendarTokens/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: t('calendarToken.remove.error.title'),
					text: e.data?.message ?? t('calendarToken.remove.error.message'),
				})
			}
		}
	}
}
</script>

<template lang="pug">
h1.kern-heading-large {{ $t('calendarToken.title') }}
p.kern-body.mb-8 {{ $t('calendarToken.intro') }}
KernTable(
	:caption="$t('calendarToken.table.caption')"
	create-permission="calendarTokens.create"
	update-permission="calendarTokens.update"
	delete-permission="calendarTokens.delete"
	show-actions
	:columns="[ 'name', 'url', 'lastAccessedAt' ]"
	:data="data"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| {{ $t('calendarToken.field.name') }}
	template(#name-body="{ item }")
		| {{ item.name }}
	template(#url-header)
		| {{ $t('calendarToken.field.url') }}
	template(#url-body="{ item }")
		code.ff3-token {{ subscriptionUrl(item.token) }}
	template(#lastAccessedAt-header)
		| {{ $t('calendarToken.field.lastAccessedAt') }}
	template(#lastAccessedAt-body="{ item }")
		| {{ item.lastAccessedAt ? formatDatetime(item.lastAccessedAt, 'compact') : $t('calendarToken.never') }}
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			@click="copy(item.token)"
		)
			span.kern-icon(
				aria-hidden="true"
				:class="copied === item.token ? 'kern-icon--check' : 'kern-icon--content-copy'"
			)
			span.kern-label.kern-sr-only {{ copied === item.token ? $t('calendarToken.copy.done') : $t('calendarToken.copy.action') }}
CalendarTokenEditor(
	ref="editor"
	@refresh="refresh"
)
</template>

<style scoped>
/* Der Link ist lang und darf die Tabelle nicht auseinanderziehen. */
.ff3-token {
	overflow-wrap: anywhere;
	font-size: 0.875em;
}
</style>
