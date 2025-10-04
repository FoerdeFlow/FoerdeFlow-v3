<script setup lang="ts">
import type { OrganizationItem, Permission } from '~/types'

const props = defineProps<{
	role: string
	permission: Permission
	id?: string
	scope: 'global' | 'organizationItem'
	organizationItem?: OrganizationItem
	isAdmin?: boolean
}>()

const emit = defineEmits<{
	refresh: []
}>()

const authStore = useAuthStore()

async function addPermission() {
	await $fetch('/api/rolePermissions', {
		method: 'POST',
		body: {
			role: props.role,
			permission: props.permission?.id,
			organizationItem: props.scope === 'organizationItem' ? props.organizationItem?.id : null,
		},
	})
	emit('refresh')
}

async function removePermission() {
	await $fetch(`/api/rolePermissions/${props.id}`, {
		method: 'DELETE',
	})
	emit('refresh')
}

function isEditable(editAction: 'create' | 'delete') {
	return authStore.hasPermission(`rolePermissions.${editAction}`).value &&
		!props.isAdmin &&
		props.permission?.assignable
}
</script>

<template lang="pug">
.flex.gap-2
	template(v-if="!props.permission")
		span.kern-badge.kern-badge--info.flex-1
			span.kern-icon.kern-icon--info(aria-hidden="true")
			span.kern-label.kern-label--small Nicht vorhanden
	template(v-else-if="props.permission.scope === 'global' && props.scope === 'organizationItem'")
		span.kern-badge.kern-badge--info.flex-1
			span.kern-icon.kern-icon--info(aria-hidden="true")
			span.kern-label.kern-label--small Nur global
	template(v-else-if="props.isAdmin || props.id")
		span.kern-badge.kern-badge--success.flex-1
			span.kern-icon.kern-icon--success(aria-hidden="true")
			span.kern-label.kern-label--small Berechtigt
		button.kern-btn.kern-btn--tertiary(
			v-if="isEditable('delete')"
			@click="removePermission()"
		)
			span.kern-icon.kern-icon--close(aria-hidden="true")
			span.kern-label.kern-sr-only Verweigern
	template(v-else)
		span.kern-badge.kern-badge--danger.flex-1
			span.kern-icon.kern-icon--danger(aria-hidden="true")
			span.kern-label.kern-label--small Verboten
		button.kern-btn.kern-btn--tertiary(
			v-if="isEditable('create')"
			@click="addPermission()"
		)
			span.kern-icon.kern-icon--check(aria-hidden="true")
			span.kern-label.kern-sr-only Erlauben
</template>
