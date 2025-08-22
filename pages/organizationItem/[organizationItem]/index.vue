<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()
const confirmDialogStore = useConfirmDialogStore()

const { data } = useFetch(() => `/api/organizationItems/${route.params.organizationItem}`)
const { data: memberships, refresh: refreshMemberships } = useFetch(() => `/api/memberships?organizationItem=${route.params.organizationItem}`)
const { data: organizationItemParticipants, refresh: refreshOrganizationItemParticipants } = useFetch(() => `/api/organizationItemParticipants?organizationItem=${route.params.organizationItem}`)

import { MembershipEditor } from '#components'
const dialog = useTemplateRef<InstanceType<typeof MembershipEditor>>('dialog')

const organizationItemParticipantEditor = useTemplateRef<InstanceType<typeof MembershipEditor>>('organizationItemParticipantEditor')

function create() {
	if(!organizationItemParticipantEditor.value) return
	organizationItemParticipantEditor.value.create()
}

async function edit({ id }: { id: string }) {
	if(!organizationItemParticipantEditor.value) return
	organizationItemParticipantEditor.value.edit(id)
}

async function remove({ id }: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: 'Sitzungsteilnahmegruppe entfernen',
		text: 'Möchten Sie diese Sitzungsteilnahmegruppe wirklich entfernen?',
	})) {
		await $fetch(`/api/organizationItemParticipants/${id}`, {
			method: 'DELETE',
		})
		await refreshOrganizationItemParticipants()
	}
}
</script>

<template lang="pug">
template(v-if="data")
	header
		p.kern-preline Organisationseinheit
		h1.kern-heading-large {{ data.name }} ({{ data.code }})
	.kern-container
		.kern-row
			.kern-col(v-if="data.parent")
				article.kern-card
					.kern-card__container
						.kern-card__header
							p.kern-preline Übergeordnete Organisationseinheit
							h2.kern-title {{ data.parent.name }} ({{ data.parent.code }})
			.kern-col(v-if="data.children.length > 0")
				article.kern-card
					.kern-card__container
						.kern-card__header
							h2.kern-title Untergeordnete Organisationseinheiten
						.kern-card__body
							ul
								li(v-for="item of data.children" :key="item.id")
									| {{ item.name }} ({{ item.code }})
	table.kern-table
		caption.kern-title Liste der Mitglieder
		thead.kern-table__head
			tr.kern-table__row
				th.kern-table__header(
					scope="col"
				)
					em Mitgliedschaftsart
					br
					| Mitglied
				th.kern-table__header(
					scope="col"
				) Dauer der Mitgliedschaft
				th.kern-table__header(
					v-if="authStore.hasPermission('memberships.update') || authStore.hasPermission('memberships.delete')"
					scope="col"
				) Aktionen
		tbody.kern-table__body
			tr.kern-table__row(v-if="memberships?.length === 0")
				td.kern-table__cell(colspan="3") Keine Einträge gefunden.
			tr.kern-table__row(v-for="item of memberships" :key="item.id")
				td.kern-table__cell
					em {{ item.membershipType.name }} ({{ item.membershipType.code }})
					br
					template(v-if="item.memberType === 'person'")
						| {{ item.memberPerson.callName || item.memberPerson.firstName }} {{ item.memberPerson.lastName }}
					template(v-if="item.memberType === 'organization_item'")
						| {{ item.memberOrganizationItem.name }} ({{ item.memberOrganizationItem.code }})
				td.kern-table__cell
					template(v-if="item.startDate")
						| seit {{ formatDate(item.startDate, 'compact') }}
					br
					template(v-if="item.endDate")
						| bis {{ formatDate(item.endDate, 'compact') }}
					template(v-if="item.endReason")
						|
						| ({{ item.endReason.name }})
				td.kern-table__cell
					button.kern-btn.kern-btn--tertiary(@click="dialog.edit(item.id)")
						template(v-if="authStore.hasPermission('memberships.update')")
							span.kern-icon.kern-icon--edit(aria-hidden="true")
							span.kern-label.kern-sr-only Bearbeiten
						template(v-else)
							span.kern-icon.kern-icon--visibility(aria-hidden="true")
							span.kern-label.kern-sr-only Anzeigen
	button.my-4.kern-btn.kern-btn--primary(
		v-if="authStore.hasPermission('memberships.create')"
		@click="dialog.create()"
	)
		span.kern-label Erstellen
	MembershipEditor(
		ref="dialog"
		:organizationItem="route.params.organizationItem"
		:readonly="!authStore.hasPermission('memberships.update')"
		@refresh="refreshMemberships"
	)
	KernTable(
		caption="Liste der Sitzungsteilnehmer"
		create-permission="organizationItemParticipants.create"
		update-permission="organizationItemParticipants.update"
		delete-permission="organizationItemParticipants.delete"
		:data="organizationItemParticipants || []"
		:columns="['name', 'participant']"
		@create="create"
		@edit="edit"
		@remove="remove"
	)
		template(#name-header)
			| Name
		template(#name-body="{ item }")
			| {{ item.groupName }}
		template(#participant-header)
			| Organisationseinheit
			br
			em Mitgliedschaftsart
		template(#participant-body="{ item }")
			| {{ item.participantOrganizationItem.name }} ({{ item.participantOrganizationItem.code }})
			br
			em {{ item.participantMembershipType.name }} ({{ item.participantMembershipType.code }})
	OrganizationItemParticipantEditor(
		ref="organizationItemParticipantEditor"
		:organizationItem="route.params.organizationItem"
		@refresh="refreshOrganizationItemParticipants"
	)
</template>