<script setup lang="ts">
import { MembershipEditor } from '#components'

const route = useRoute('organizationItems-organizationItem-members')
const authStore = useAuthStore()

const { data: organizationItem } =
	useFetch(() => `/api/organizationItems/${route.params.organizationItem}`, {
		default: () => ({ code: '', name: '' }),
	})

const { data, refresh } =
	useFetch(() => `/api/memberships?organizationItem=${route.params.organizationItem}`)

const dialog = useTemplateRef<InstanceType<typeof MembershipEditor>>('dialog')
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
		tr.kern-table__row(v-if="data?.length === 0")
			td.kern-table__cell(colspan="3") Keine Einträge gefunden.
		tr.kern-table__row(
			v-for="item of data"
			:key="item.id"
		)
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
	:organization-item="route.params.organizationItem"
	:readonly="!authStore.hasPermission('memberships.update')"
	@refresh="refresh"
)
</template>
