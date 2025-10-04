<script setup lang="ts">
import type { OrganizationItem } from '~/types'

const route = useRoute('roles-role-permissions')
const { t } = useI18n()
const authStore = useAuthStore()

const { data: roleData } = useFetch(() => `/api/roles/${route.params.role}`, {
	default: () => ({
		name: '',
		isAdmin: false,
	}),
})

const { data, refresh } = useFetch(() => `/api/rolePermissions?role=${route.params.role}`)

const { data: permissions } = useFetch('/api/permissions', {
	default: () => [] as { id: string, scope: 'global' | 'organizationItem', assignable: boolean }[],
	query: {
		filter: 'all',
	},
})

const scope = ref<OrganizationItem>(null)

const relations = computed(() => permissions.value
	.filter(({ id }) => id.endsWith('.read'))
	.map(({ id }) => id.split('.')[0] ?? ''))

const actions = [
	'read',
	'create',
	'update',
	'delete',
]
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'roles-role', params: { role: route.params.role } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Rolle
header
	h1.kern-heading-large Berechtigungen der Rolle {{ roleData.name }}
KernAlert(
	v-if="(authStore.hasPermission('rolePermissions.create').value || authStore.hasPermission('rolePermissions.delete').value) && roleData.isAdmin"
	type="info"
	:title="t('permissions.adminAlert.title')"
	:text="t('permissions.adminAlert.text')"
	:dismissible="false"
)
.mb-8
	.kern-form-input
		label.kern-label(for="scope") Geltungsbereich auswählen
		OrganizationItemSelect#scope(
			v-model="scope"
			label-null="Global"
		)
table.kern-table
	caption.kern-title
		template(v-if="scope")
			| Berechtigungsübersicht für: {{ formatOrganizationItem(scope) }}
		template(v-else)
			| Globale Berechtigungsübersicht
	colgroup
		col(span="1")
		col(
			v-for="action of actions"
			:key="action"
			span="1"
			:style="{ width: '13em' }"
		)
	thead.kern-table__head
		tr.kern-table__row
			th.kern-table__header Relation
			th.kern-table__header.pl-2(
				v-for="action of actions"
				:key="action"
				scope="col"
			) {{ t(`permissions.actions.${action}`) }}
	tbody.kern-table__body
		tr.kern-table__row(
			v-for="relation of relations"
			:key="relation"
		)
			th.text-left(scope="row") {{ t(`permissions.relations.${relation}`) }}
			td.p-2(
				v-for="action of actions"
				:key="action"
			)
				RolePermissionBadge(
					:id="data?.find(item => item.permission === `${relation}.${action}` && item.organizationItem === (scope?.id ?? null))?.id"
					:role="route.params.role"
					:permission="permissions.find(item => item.id === `${relation}.${action}`) ?? null"
					:scope="scope ? 'organizationItem' : 'global'"
					:organization-item="scope"
					:is-admin="roleData.isAdmin"
					@refresh="refresh()"
				)
</template>
