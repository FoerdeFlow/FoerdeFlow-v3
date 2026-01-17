<script setup lang="ts">
import type { ElectionProposalEditor } from '#components'

const route = useRoute('elections-election-committees-committee-proposals')
const confirmDialogStore = useConfirmDialogStore()

const { data: electionCommittee } =
	useFetch(() => `/api/electionCommittees/${route.params.committee}`, {
		default: () => ({ committee: null }),
	})

const { data, refresh } =
	useFetch(() => `/api/electionProposals?electionCommittee=${route.params.committee}`)

const editor = useTemplateRef<InstanceType<typeof ElectionProposalEditor>>('electionProposalEditor')

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
		title: 'Wahlvorschlag entfernen',
		text: 'Möchten Sie diesen Wahlvorschlag wirklich entfernen?',
	})) {
		await $fetch(`/api/electionProposals/${id}`, {
			method: 'DELETE',
		})
		await refresh()
	}
}
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'elections-election-committees-committee', params: { election: route.params.election, committee: route.params.committee } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zu: {{ electionCommittee.committee?.name }}
header
	h1.kern-heading-large Wahlvorschläge
KernTable(
	caption="Liste der Wahlvorschläge"
	create-permission="electionProposals.create"
	update-permission="electionProposals.update"
	delete-permission="electionProposals.delete"
	:data="data || []"
	:columns="['submitter']"
	show-actions
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#submitter-header)
		| Einreicher*in
	template(#submitter-body="{ item }")
		| {{ formatPerson(item.submitter) }}
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to=`{
				name: 'elections-election-committees-committee-proposals-proposal',
				params: {
					election: route.params.election,
					committee: route.params.committee,
					proposal: item.id,
				},
			}`
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
ElectionProposalEditor(
	ref="electionProposalEditor"
	:election-committee="route.params.committee"
	@refresh="refresh"
)
</template>
