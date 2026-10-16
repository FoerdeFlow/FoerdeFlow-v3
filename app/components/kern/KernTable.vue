<script setup lang="ts" generic="T extends Record<string, unknown>">
import type { Scope } from '~/types'

const props = defineProps<{
	caption: string
	columns: (string | {
		name: string
		width?: string
		class?: string
	})[]
	createPermission: string | true | null
	updatePermission: string | true | null
	deletePermission: string | true | null
	showActions?: boolean
	showFooter?: boolean
	data: T[]
	/**
	 * Splits the rows into groups, each with a heading row of its own. The groups
	 * are meant not to overlap; within a group the rows keep their order from
	 * `data`, and empty groups are left out.
	 */
	groups?: {
		key: string
		label: string
		includes: (item: NoInfer<T>) => boolean
		/** Sets the rows of the group in a muted colour, for entries of the past. */
		muted?: boolean
	}[]
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

/*
 * Ohne Gruppen ist der ganze Inhalt ein einziger Abschnitt ohne Überschrift.
 * Jeder Abschnitt wird ein eigenes `tbody`, damit Vorlesehilfen die Zeilen
 * ihrer Gruppenüberschrift zuordnen.
 */
const bodies = computed(() =>
	(props.groups ?? [ { key: 'all', label: null, includes: () => true, muted: false } ])
		.map((group) => ({ ...group, items: props.data.filter((item) => group.includes(item)) }))
		.filter((group) => group.items.length > 0))

const authStore = useAuthStore()

function checkAllowed(permission: string | true | null) {
	if(permission === null) return false
	if(permission === true) return true
	return authStore.hasPermission(permission, props.scope).value
}

const createAllowed = computed(() => checkAllowed(props.createPermission))
const updateAllowed = computed(() => checkAllowed(props.updatePermission))
const deleteAllowed = computed(() => checkAllowed(props.deletePermission))

const showActions = computed(() => props.showActions || updateAllowed.value || deleteAllowed.value)
</script>

<template lang="pug">
.kern-table__wrapper
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
		tbody.kern-table__body(v-if="bodies.length === 0")
			tr.kern-table__row
				td.kern-table__cell(
					:colspan="columns.length + (showActions ? 1 : 0)"
				) Keine Einträge gefunden.
		tbody.kern-table__body(
			v-for="body of bodies"
			:key="body.key"
			:class="{ 'ff3-table__body--muted': body.muted }"
		)
			tr.kern-table__row(v-if="body.label")
				th.kern-table__header.ff3-table__group(
					:colspan="columns.length + (showActions ? 1 : 0)"
					scope="rowgroup"
				) {{ body.label }}
			tr.kern-table__row(
				v-for="(item, idx) of body.items"
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
		tfoot.kern-table__footer(v-if="props.showFooter")
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
				th.kern-table__header(
					v-if="showActions"
					scope="col"
				)
	button.my-4.kern-btn.kern-btn--primary(
		v-if="createAllowed"
		@click="emit('create')"
	)
		span.kern-icon.kern-icon--add(aria-hidden="true")
		span.kern-label Erstellen
</template>

<style scoped>
.kern-table__wrapper {
	overflow-x: auto;
}

.ff3-table__group {
	background-color: var(--kern-color-layout-background-hued);
}

/* Auch Links und Inhalte aus Slots treten zurück, bleiben aber unterstrichen. */
.ff3-table__body--muted td,
.ff3-table__body--muted td :deep(a) {
	color: var(--kern-color-layout-text-muted);
}
</style>
