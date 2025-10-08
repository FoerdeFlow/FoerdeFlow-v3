<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { Scope } from '~/types'

const props = defineProps<{
	caption: string
	columns: (string | {
		name: string
		width?: string
		class?: string
	})[]
	createPermission: string | null
	updatePermission: string | null
	deletePermission: string | null
	showActions?: boolean
	data: T[]
	scope?: Scope
}>()

const emit = defineEmits<{
	create: []
	edit: [T]
	remove: [T]
}>()

defineSlots<{
	[slotName: `${string}-header`]: (props: {}) => unknown
	[slotName: `${string}-body`]: (props: { item: T }) => unknown
	[slotName: `${string}-footer`]: (props: {}) => unknown
	actions: (props: { item: T }) => unknown
}>()

const columns = computed(() =>
	props.columns.map((column) => typeof column === 'string' ? { name: column } : column),
)

const authStore = useAuthStore()

const createAllowed = computed(() =>
	Boolean(props.createPermission && authStore.hasPermission(props.createPermission, props.scope).value),
)
const updateAllowed = computed(() =>
	Boolean(props.updatePermission && authStore.hasPermission(props.updatePermission, props.scope).value),
)
const deleteAllowed = computed(() =>
	Boolean(props.deletePermission && authStore.hasPermission(props.deletePermission, props.scope).value),
)

const showActions = computed(() => props.showActions || updateAllowed.value || deleteAllowed.value)
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
			v-if="showActions"
			span="1"
			style="width: 10em"
		)
	thead.kern-table__head
		tr.kern-table__row
			th.kern-table__header(
				v-for="column of columns"
				:key="column.name"
				:class="column.class ? `kern-table__header--${column.class}` : ''"
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
				:class="column.class ? `kern-table__cell--${column.class}` : ''"
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
					v-if="updateAllowed"
					@click="emit('edit', item)"
				)
					span.kern-icon.kern-icon--edit(aria-hidden="true")
					span.kern-label.kern-sr-only Bearbeiten
				button.kern-btn.kern-btn--tertiary(
					v-if="deleteAllowed"
					@click="emit('remove', item)"
				)
					span.kern-icon.kern-icon--delete(aria-hidden="true")
					span.kern-label.kern-sr-only Löschen
	tfoot.kern-table__footer
		tr.kern-table__row
			th.kern-table__header(
				v-for="column of columns"
				:key="column.name"
				:class="column.class ? `kern-table__header--${column.class}` : ''"
				scope="col"
			)
				slot(
					:name="`${column.name}-footer`"
				)
button.my-4.kern-btn.kern-btn--primary(
	v-if="createAllowed"
	@click="emit('create')"
)
	span.kern-icon.kern-icon--add(aria-hidden="true")
	span.kern-label Erstellen
</template>
