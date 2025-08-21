<script setup lang="ts" generic="T extends Record<string, unknown>">
const props = defineProps<{
	caption: string
	columns: string[]
	createPermission: string
	updatePermission: string
	deletePermission: string
	data: T[]
}>()

const emit = defineEmits<{
	create: []
	edit: [T]
	remove: [T]
}>()

const authStore = useAuthStore()

const showActions = computed(() => authStore.hasPermission(props.updatePermission).value || authStore.hasPermission(props.deletePermission).value)
</script>

<template lang="pug">
table.kern-table
	caption.kern-title {{ props.caption }}
	thead.kern-table__head
		tr.kern-table__row
			th.kern-table__header(
				v-for="column of props.columns"
				scope="col"
			)
				slot(
					:name="`${column}-header`"
				)
			th.kern-table__header(
				v-if="showActions"
				scope="col"
			) Aktionen
	tbody.kern-table__body
		tr.kern-table__row(v-if="data.length === 0")
			td.kern-table__cell(
				:colspan="props.columns.length + (showActions ? 1 : 0)"
			) Keine Einträge gefunden.
		tr.kern-table__row(v-for="item of data")
			td.kern-table__cell(
				v-for="column of props.columns"
			)
				slot(
					:name="`${column}`"
					:item="item"
				)
			td.kern-table__cell(
				v-if="showActions"
			)
				button.kern-btn.kern-btn--tertiary(
					v-if="authStore.hasPermission(props.updatePermission).value"
					@click="emit('edit', item)"
				)
					span.kern-icon.kern-icon--edit(aria-hidden="true")
					span.kern-label.kern-sr-only Bearbeiten
				button.kern-btn.kern-btn--tertiary(
					v-if="authStore.hasPermission(props.deletePermission).value"
					@click="emit('remove', item)"
				)
					span.kern-icon.kern-icon--delete(aria-hidden="true")
					span.kern-label.kern-sr-only Löschen
button.my-4.kern-btn.kern-btn--primary(
	v-if="authStore.hasPermission(props.createPermission).value"
	@click="emit('create')"
)
	span.kern-icon.kern-icon--add(aria-hidden="true")
	span.kern-label Erstellen
</template>