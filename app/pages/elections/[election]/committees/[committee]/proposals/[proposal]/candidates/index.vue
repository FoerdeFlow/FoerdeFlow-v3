<script setup lang="ts">
import type { CandidateEditor } from '#components'

const route = useRoute('elections-election-committees-committee-proposals-proposal-candidates')
const confirmDialogStore = useConfirmDialogStore()
const authStore = useAuthStore()

const { data: electionProposal } =
	useFetch(() => `/api/electionProposals/${route.params.proposal}`, {
		default: () => ({ submitter: null }),
	})

const { data, refresh } =
	useFetch(() => `/api/candidates?electionProposal=${route.params.proposal}`)

const editor = useTemplateRef<InstanceType<typeof CandidateEditor>>('candidateEditor')

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
		title: 'Kandidatur entfernen',
		text: 'Möchten Sie diese Kandidatur wirklich entfernen?',
	})) {
		await $fetch(`/api/candidates/${id}`, {
			method: 'DELETE',
		})
		await refresh()
	}
}
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to=`{
			name: 'elections-election-committees-committee-proposals-proposal',
			params: {
				election: route.params.election,
				committee: route.params.committee,
				proposal: route.params.proposal,
			},
		}`
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zu: Wahlvorschlag von {{ formatPerson(electionProposal.submitter) }}
header
	h1.kern-heading-large Kandidaturen
KernTable(
	caption="Liste der Kandidaturen"
	create-permission="candidates.create"
	update-permission="candidates.update"
	delete-permission="candidates.delete"
	:data="data || []"
	:columns="['candidate']"
	show-actions
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#candidate-header)
		| Kandidat*in
	template(#candidate-body="{ item }")
		| {{ formatPerson(item.candidate) }}
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			v-if="!authStore.hasPermission('candidates.update').value"
			@click="edit(item)"
		)
			span.kern-icon.kern-icon--visibility(aria-hidden="true")
			span.kern-label.kern-sr-only Anzeigen
CandidateEditor(
	ref="candidateEditor"
	:election-proposal="route.params.proposal"
	:readonly="!authStore.hasPermission('candidates.update').value"
	@refresh="refresh"
)
</template>
