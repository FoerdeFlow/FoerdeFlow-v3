<script setup lang="ts">
import type { OrganizationItemGroupEditor } from '#components'

const route = useRoute('organizationItems-organizationItem-groups')
const confirmDialogStore = useConfirmDialogStore()

const { data: organizationItem } =
	useFetch(() => `/api/organizationItems/${route.params.organizationItem}`, {
		default: () => ({ code: '', name: '' }),
	})

const { data, refresh } =
	useFetch(() => `/api/organizationItemGroups?organizationItem=${route.params.organizationItem}`)

const editor = useTemplateRef<InstanceType<typeof OrganizationItemGroupEditor>>('organizationItemGroupEditor')

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
		title: 'OE-Gruppe entfernen',
		text: 'Möchten Sie diese OE-Gruppe wirklich entfernen?',
	})) {
		await $fetch(`/api/organizationItemGroups/${id}`, {
			method: 'DELETE',
		})
		await refresh()
	}
}
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'organizationItems-organizationItem', params: { organizationItem: route.params.organizationItem } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zu: {{ organizationItem.name }} ({{ organizationItem.code }})
header
	h1.kern-heading-large Gruppen im {{ organizationItem.name }} ({{ organizationItem.code }})
p.mb-8.kern-text
	| Gruppen sind Beteiligte bei dieser Organisationseinheit und/oder deren Sitzungen.
	| Sie können aus Mitgliedern der Organisationseinheit oder aus bestimmten Rollen anderer Organisationseinheiten bestehen.
KernTable(
	caption="Liste der Gruppen"
	create-permission="organizationItemGroups.create"
	update-permission="organizationItemGroups.update"
	delete-permission="organizationItemGroups.delete"
	:data="data || []"
	:columns="['name', 'participant']"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| Gruppenname
		br
		em Rollenname
	template(#name-body="{ item }")
		| {{ item.groupName }}
		br
		em {{ item.roleName }}
	template(#participant-header)
		| Mitgliedschaftsart in Organisationseinheit
	template(#participant-body="{ item }")
		ul
			li(
				v-for="(member, idx) of item.members"
				:key="idx"
			)
				| {{ member.membershipType.name }} ({{ member.membershipType.code }})
				|
				| in
				|
				| {{ member.organizationItem.name }} ({{ member.organizationItem.code }})
OrganizationItemGroupEditor(
	ref="organizationItemGroupEditor"
	:organization-item="route.params.organizationItem"
	@refresh="refresh"
)
</template>
