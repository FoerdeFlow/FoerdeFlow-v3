<script setup lang="ts">
import type { ElectionCommitteeEditor } from '#components'

const route = useRoute('elections-election-committees')
const confirmDialogStore = useConfirmDialogStore()

const { data: election } =
	useFetch(() => `/api/elections/${route.params.election}`, {
		default: () => ({ title: '' }),
	})

const { data, refresh } =
	useFetch(() => `/api/electionCommittees?election=${route.params.election}`)

const editor = useTemplateRef<InstanceType<typeof ElectionCommitteeEditor>>('electionCommitteeEditor')

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
		title: 'Wahlgremium entfernen',
		text: 'Möchten Sie dieses Wahlgremium wirklich entfernen?',
	})) {
		await $fetch(`/api/electionCommittees/${id}`, {
			method: 'DELETE',
		})
		await refresh()
	}
}
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'elections-election', params: { election: route.params.election } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zu: {{ election.title }}
header
	h1.kern-heading-large Wahlgremien
p.mb-8.kern-text
	| Wahlgremien sind die Gremien, für welche im Rahmen der Wahl Wahlvorschläge eingereicht werden können.
KernTable(
	caption="Liste der Wahlgremien"
	create-permission="electionCommittees.create"
	update-permission="electionCommittees.update"
	delete-permission="electionCommittees.delete"
	:data="data || []"
	:columns="['committee']"
	show-actions
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#committee-header)
		| Wahlgremium
	template(#committee-body="{ item }")
		| {{ formatOrganizationItem(item.committee) }}
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to="{ name: 'elections-election-committees-committee', params: { election: route.params.election, committee: item.id } }"
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
ElectionCommitteeEditor(
	ref="electionCommitteeEditor"
	:election="route.params.election"
	@refresh="refresh"
)
</template>
