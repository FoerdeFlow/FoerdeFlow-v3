<script setup lang="ts">
import type { KernCardNavItems } from '~/types'

const route = useRoute('roles-role')

const { data } = useFetch(() => `/api/roles/${route.params.role}`, {
	default: () => ({
		code: '',
		name: '',
		isAdmin: false,
	}),
})

const subPages: KernCardNavItems = [
	{
		title: 'Rolleninhaber',
		link: {
			name: 'roles-role-occupants',
			params: { role: route.params.role },
		},
		linkLabel: 'Rolleninhaber anzeigen',
		permission: 'roleOccupants.read',
	},
	{
		title: 'Berechtigungen',
		description: 'Übersicht über die Berechtigungen',
		link: {
			name: 'roles-role-permissions',
			params: { role: route.params.role },
		},
		linkLabel: 'Berechtigungen anzeigen',
		permission: 'rolePermissions.read',
	},
]
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'roles' }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Übersicht
header
	p.kern-preline Rolle
	h1.kern-heading-large {{ data.name }} ({{ data.code }})
section.my-4(
	v-if="data.isAdmin"
)
	RoleIsAdminBadge(:is-admin="data.isAdmin")
KernCardNav(:items="subPages")
</template>
