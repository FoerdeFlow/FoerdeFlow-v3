<script setup lang="ts">
const props = defineProps<{
	caption: string
	memberships: {
		id: string
		comment: string | null
		startDate: string | Date | null
		endDate: string | Date | null
		organizationItem: {
			id: string
			name: string
			code: string
			organizationType: {
				name: string
				code: string
			}
		}
		membershipType: {
			name: string
			code: string
		}
		endReason: {
			name: string
			code: string
		} | null
	}[]
}>()
</script>

<template lang="pug">
KernTable(
	:caption="props.caption"
	:columns="[ 'organizationItem', 'membershipType', 'duration' ]"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	:data="props.memberships"
)
	template(#organizationItem-header)
		em OE-Kategorie
		br
		| Organisationseinheit
	template(#organizationItem-body="{ item }")
		em {{ formatOrganizationType(item.organizationItem.organizationType) }}
		br
		NuxtLink.kern-link(
			:to="{ name: 'organizationItems-organizationItem', params: { organizationItem: item.organizationItem.id } }"
		) {{ formatOrganizationItem(item.organizationItem) }}
	template(#membershipType-header)
		| Mitgliedschaftsart
	template(#membershipType-body="{ item }")
		| {{ formatMembershipType(item.membershipType) }}
		template(v-if="item.comment")
			br
			| {{ item.comment }}
	template(#duration-header)
		| Dauer der Mitgliedschaft
	template(#duration-body="{ item }")
		template(v-if="item.startDate")
			| seit {{ formatDate(item.startDate, 'compact') }}
		template(v-if="item.endDate")
			br
			| bis {{ formatDate(item.endDate, 'compact') }}
		template(v-if="item.endReason")
			br
			| {{ formatMembershipEndReason(item.endReason) }}
</template>
