<script setup lang="ts">
import { FetchError } from 'ofetch'
import { MembershipEditor } from '#components'

const route = useRoute('organizationItems-organizationItem-members')
const authStore = useAuthStore()
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()

const { data: organizationItem } =
	useFetch(() => `/api/organizationItems/${route.params.organizationItem}`, {
		default: () => ({ code: '', name: '' }),
	})

const { data, refresh } =
	useFetch(() => `/api/memberships?organizationItem=${route.params.organizationItem}`)

const editor = useTemplateRef<InstanceType<typeof MembershipEditor>>('editor')

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
		title: 'Mitgliedschaft löschen?',
		text: 'Sind Sie sicher, dass Sie diese Mitgliedschaft löschen möchten?',
	})) {
		try {
			await $fetch(`/api/memberships/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: 'Fehler beim Löschen',
					text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
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
		:to="{ name: 'organizationItems-organizationItem', params: { organizationItem: route.params.organizationItem } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zu: {{ organizationItem.name }} ({{ organizationItem.code }})
header
	h1.kern-heading-large Mitglieder im {{ organizationItem.name }} ({{ organizationItem.code }})
p.mb-8.kern-text
	| Mitglieder sind Personen oder Organisationseinheiten, die Teil dieser Organisationseinheit sind.
	| Ihre Rolle in der Organisationseinheit ergibt sich aus der Mitgliedschaftsart.
KernTable(
	caption="Liste der Mitglieder"
	:columns="[ 'member', 'duration' ]"
	create-permission="memberships.create"
	update-permission="memberships.update"
	delete-permission="memberships.delete"
	show-actions
	:data="data ?? []"
	:scope="scope"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#member-header)
		em Mitgliedschaftsart
		br
		| Mitglied
	template(#member-body="{ item }")
		em {{ item.membershipType.name }} ({{ item.membershipType.code }})
		br
		template(v-if="item.memberType === 'person'")
			| {{ item.memberPerson.callName || item.memberPerson.firstName }} {{ item.memberPerson.lastName }}
		template(v-if="item.memberType === 'organizationItem'")
			| {{ item.memberOrganizationItem.name }} ({{ item.memberOrganizationItem.code }})
	template(#duration-header)
		| Dauer der Mitgliedschaft
	template(#duration-body="{ item }")
		template(v-if="item.startDate")
			| seit {{ formatDate(item.startDate, 'compact') }}
		br
		template(v-if="item.endDate")
			| bis {{ formatDate(item.endDate, 'compact') }}
		template(v-if="item.endReason")
			|
			| ({{ item.endReason.name }})
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			v-if="!authStore.hasPermission('memberships.update', scope).value"
			@click="edit(item)"
		)
			span.kern-icon.kern-icon--visibility(aria-hidden="true")
			span.kern-label.kern-sr-only Anzeigen
MembershipEditor(
	ref="editor"
	:organization-item="route.params.organizationItem"
	:readonly="!authStore.hasPermission('memberships.update', scope).value"
	@refresh="refresh"
)
</template>
