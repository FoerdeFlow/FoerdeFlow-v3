<script setup lang="ts">
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
	query: {
		filter: 'all',
	},
})

const relations = computed(() => permissions.value
	?.filter(({ permission }) => permission.endsWith('.read'))
	?.map(({ permission }) => permission.split('.')[0] ?? '') ?? [])

const actions = [
	'read',
	'create',
	'update',
	'delete',
]

async function addPermission(permission: string) {
	await $fetch('/api/rolePermissions', {
		method: 'POST',
		body: {
			role: route.params.role,
			permission,
		},
	})
	await refresh()
}

async function removePermission(id: string) {
	await $fetch(`/api/rolePermissions/${id}`, {
		method: 'DELETE',
	})
	await refresh()
}

function isEditable(editAction: 'create' | 'delete', relation: string, action: string) {
	return authStore.hasPermission(`rolePermissions.${editAction}`).value &&
		!roleData.value.isAdmin &&
		permissions.value?.find((item) => item.permission === `${relation}.${action}`)?.assignable
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
	h1.kern-heading-large Berechtigungen der Rolle {{ roleData.name }}
KernAlert(
	v-if="(authStore.hasPermission('rolePermissions.create').value || authStore.hasPermission('rolePermissions.delete').value) && roleData.isAdmin"
	type="info"
	:title="t('permissions.adminAlert.title')"
	:text="t('permissions.adminAlert.text')"
	:dismissible="false"
)
table.kern-table
	caption.kern-title Berechtigungsübersicht
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
			th(scope="row") {{ t(`permissions.relations.${relation}`) }}
			td.p-2(
				v-for="action of actions"
				:key="action"
			)
				.flex.gap-2
					template(v-if="!permissions?.some(item => item.permission === `${relation}.${action}`)")
						span.kern-badge.kern-badge--info.flex-1
							span.kern-icon.kern-icon--info(aria-hidden="true")
							span.kern-label.kern-label--small Nicht vorhanden
					template(v-else-if="roleData.isAdmin || data?.some(item => item.permission === `${relation}.${action}`)")
						span.kern-badge.kern-badge--success.flex-1
							span.kern-icon.kern-icon--success(aria-hidden="true")
							span.kern-label.kern-label--small Berechtigt
						button.kern-btn.kern-btn--tertiary(
							v-if="isEditable('delete', relation, action)"
							@click="removePermission(data?.find(item => item.permission === `${relation}.${action}`)?.id ?? '')"
						)
							span.kern-icon.kern-icon--close(aria-hidden="true")
							span.kern-label.kern-sr-only Verweigern
					template(v-else)
						span.kern-badge.kern-badge--danger.flex-1
							span.kern-icon.kern-icon--danger(aria-hidden="true")
							span.kern-label.kern-label--small Verboten
						button.kern-btn.kern-btn--tertiary(
							v-if="isEditable('create', relation, action)"
							@click="addPermission(`${relation}.${action}`)"
						)
							span.kern-icon.kern-icon--check(aria-hidden="true")
							span.kern-label.kern-sr-only Erlauben
</template>
