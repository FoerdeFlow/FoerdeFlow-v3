<script setup lang="ts" generic="T extends Record<string, unknown>">
const props = defineProps<{
	caption: string
	columns: (string | {
		name: string
		width?: string
	})[]
	createPermission: string | null
	updatePermission: string | null
	deletePermission: string | null
	data: T[]
}>()

const emit = defineEmits<{
	create: []
	edit: [T]
	remove: [T]
}>()

defineSlots<{
	[slotName: `${string}-header`]: (props: {}) => unknown
	[slotName: `${string}-body`]: (props: { item: T }) => unknown
	actions: (props: { item: T }) => unknown
}>()

const columns = computed(() =>
	props.columns.map((column) => typeof column === 'string' ? { name: column } : column),
)

const authStore = useAuthStore()

const showActions = computed(() =>
	(props.updatePermission && authStore.hasPermission(props.updatePermission).value) ||
	(props.deletePermission && authStore.hasPermission(props.deletePermission).value),
)
</script>

<template lang="pug">
table.kern-table
	caption.kern-title {{ props.caption }}
	colgroup
		col(
			v-for="column of columns"
			:key="column.name"
			span="1"
			:style="column.width ? { width: column.width } : ''"
		)
		col(
			span="1"
			style="width: 10em"
		)
	thead.kern-table__head
		tr.kern-table__row
			th.kern-table__header(
				v-for="column of columns"
				:key="column.name"
				scope="col"
			)
				slot(
					:name="`${column.name}-header`"
				)
			th.kern-table__header(
				v-if="showActions"
				scope="col"
			) Aktionen
	tbody.kern-table__body
		tr.kern-table__row(v-if="data.length === 0")
			td.kern-table__cell(
				:colspan="columns.length + (showActions ? 1 : 0)"
			) Keine Einträge gefunden.
		tr.kern-table__row(
			v-for="(item, idx) of data"
			:key="idx"
		)
			td.kern-table__cell(
				v-for="column of columns"
				:key="column.name"
			)
				slot(
					:name="`${column.name}-body`"
					:item="item"
				)
			td.kern-table__cell(
				v-if="showActions"
			)
				slot(
					name="actions"
					:item="item"
				)
				button.kern-btn.kern-btn--tertiary(
					v-if="props.updatePermission && authStore.hasPermission(props.updatePermission).value"
					@click="emit('edit', item)"
				)
					span.kern-icon.kern-icon--edit(aria-hidden="true")
					span.kern-label.kern-sr-only Bearbeiten
				button.kern-btn.kern-btn--tertiary(
					v-if="props.deletePermission && authStore.hasPermission(props.deletePermission).value"
					@click="emit('remove', item)"
				)
					span.kern-icon.kern-icon--delete(aria-hidden="true")
					span.kern-label.kern-sr-only Löschen
button.my-4.kern-btn.kern-btn--primary(
	v-if="props.createPermission && authStore.hasPermission(props.createPermission).value"
	@click="emit('create')"
)
	span.kern-icon.kern-icon--add(aria-hidden="true")
	span.kern-label Erstellen
</template>
