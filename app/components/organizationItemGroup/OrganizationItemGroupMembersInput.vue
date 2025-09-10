<script setup lang="ts">
import type { MembershipType, OrganizationItem } from '~/types'

const id = useId()
const model = defineModel<{
	organizationItem: OrganizationItem
	membershipType: MembershipType
}[]>({
	required: true,
})
</script>

<template lang="pug">
label.kern-label(:for="id") Mitglieder
.kern-container-fluid(:id="id")
	.kern-row(
		v-for="(member, idx) of model"
		:key="idx"
	)
		OrganizationItemGroupMemberOrganizationItemInput.kern-col(v-model="member.organizationItem")
		OrganizationItemGroupMemberMembershipTypeInput.kern-col(v-model="member.membershipType")
		button.kern-btn.kern-btn--tertiary(
			type="button"
			@click="model.splice(idx, 1)"
		)
			span.kern-icon.kern-icon--delete(aria-hidden="true")
			span.kern-label.kern-sr-only Mitglied entfernen
	button.kern-btn.kern-btn--secondary(
		type="button"
		@click="model.push({ organizationItem: null, membershipType: null })"
	)
		span.kern-icon.kern-icon--add(aria-hidden="true")
		span.kern-label Neue Mitgliedschaft hinzufügen
</template>
