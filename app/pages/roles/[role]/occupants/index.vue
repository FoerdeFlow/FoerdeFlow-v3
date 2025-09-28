<script setup lang="ts">
import type { FetchError } from 'ofetch'
import type { RoleOccupantEditor } from '#components'

const route = useRoute('roles-role-occupants')
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()

const editor = useTemplateRef<typeof RoleOccupantEditor>('editor')

const { data: roleData } = useFetch(() => `/api/roles/${route.params.role}`, {
	default: () => ({
		name: '',
	}),
})

const { data, refresh } = useFetch(() => `/api/roleOccupants?role=${route.params.role}`)

function create() {
	if(!editor.value) return
	editor.value.create()
}

function edit(item: { id: string }) {
	if(!editor.value) return
	editor.value.edit(item.id)
}

async function remove(item: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: 'Rolleninhaber*in löschen?',
		text: 'Sind Sie sicher, dass Sie diesen Rolleninhaber*in löschen möchten?',
	})) {
		try {
			await $fetch(`/api/roleOccupants/${item.id}`, { method: 'DELETE' })
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
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'roles-role', params: { role: route.params.role } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Rolle
header
	h1.kern-heading-large Inhaber*innen der Rolle {{ roleData.name }}
KernTable(
	caption="Liste der Rolleninhaber*innen"
	create-permission="roleOccupants.create"
	update-permission="roleOccupants.update"
	delete-permission="roleOccupants.delete"
	:columns="['name']"
	:data="data || []"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Inhaber*in
	template(#name-body="{ item }")
		template(v-if="item.person")
			| {{ formatPerson(item.person) }}
		template(v-else-if="item.organizationItem || item.organizationType")
			template(v-if="item.organizationItem")
				| {{ formatOrganizationItem(item.organizationItem) }}
			template(v-else-if="item.organizationType")
				| {{ formatOrganizationType(item.organizationType) }}
			template(v-if="item.membershipType")
				br
				em {{ formatMembershipType(item.membershipType) }}
		template(v-else)
			| Jede*r Besucher*in
			br
			em Gastzugriff
RoleOccupantEditor(
	ref="editor"
	:role="route.params.role"
	@refresh="refresh"
)
</template>
