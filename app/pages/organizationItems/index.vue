<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { OrganizationItemEditor } from '#components'
import type { DestructureArray } from '#shared/types'

const route = useRoute('organizationItems')
const authStore = useAuthStore()
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const { data, refresh } = useFetch('/api/organizationItems')

/*
 * Die Tabelle dient der Verwaltung und ist nur mit einer globalen Berechtigung
 * erreichbar; alle anderen sehen ausschließlich das Organigramm.
 */
const canManage = computed(() => [ 'create', 'update', 'delete' ]
	.some((action) => authStore.hasPermission(`organizationItems.${action}`).value))
const showTable = computed(() => canManage.value && route.query.ansicht === 'tabelle')

type TreeItem = DestructureArray<typeof data.value>
const flattenTree = (tree: TreeItem[], prefix = ''): (TreeItem & { displayName: string })[] => tree.flatMap((item) => ([
	{
		...item,
		displayName: `${prefix}${item.name} (${item.code})`,
	},
	...flattenTree(item.children, `${prefix}— `),
]))
const organizationItems = computed(() => data.value ? flattenTree(data.value) : [])

/*
 * Ein Abschnitt je OE-Kategorie der obersten Einheiten. Untergeordnete
 * Einheiten bleiben bei ihrer Wurzel, auch wenn sie einer anderen Kategorie
 * angehören.
 */
const sections = computed(() => {
	const sections = new Map<string, { type: TreeItem['organizationType'], items: TreeItem[] }>()
	for(const item of data.value ?? []) {
		const section = sections.get(item.organizationType.id)
		if(section) {
			section.items.push(item)
		} else {
			sections.set(item.organizationType.id, { type: item.organizationType, items: [ item ] })
		}
	}
	return [ ...sections.values() ].sort((a, b) =>
		a.type.sortOrder - b.type.sortOrder || a.type.name.localeCompare(b.type.name, 'de'))
})

const editor = useTemplateRef<typeof OrganizationItemEditor>('editor')

function create() {
	if(!editor.value) return
	editor.value.create()
}

function edit({ id }: { id: string }) {
	if(!editor.value) return
	editor.value.edit(id)
}

async function remove({ id }: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: 'Organisationseinheit löschen?',
		text: 'Sind Sie sicher, dass Sie diese Organisationseinheit löschen möchten?',
	})) {
		try {
			await $fetch(`/api/organizationItems/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: 'Fehler beim Löschen',
					text: e.data?.message ?? 'Ein unbekannter Fehler ist aufgetreten.',
				})
			}
		}
	}
}
</script>

<template lang="pug">
h1.kern-heading-large Organisationseinheiten
NuxtLink.mb-8.kern-btn.kern-btn--secondary(
	v-if="canManage"
	:to="{ query: showTable ? {} : { ansicht: 'tabelle' } }"
)
	span.kern-icon(
		:class="showTable ? 'kern-icon--visibility' : 'kern-icon--edit'"
		aria-hidden="true"
	)
	span.kern-label {{ showTable ? 'Als Organigramm anzeigen' : 'Als Tabelle anzeigen' }}
template(v-if="!showTable")
	p(v-if="sections.length === 0") Keine Organisationseinheiten vorhanden.
	section.mb-8(
		v-for="section of sections"
		:key="section.type.id"
	)
		h2.kern-heading-medium {{ section.type.name }}
		OrganizationChart(
			:label="`Organigramm: ${section.type.name}`"
			:items="section.items"
		)
KernTable(
	v-else
	caption="Liste der Organisationseinheiten"
	create-permission="organizationItems.create"
	update-permission="organizationItems.update"
	delete-permission="organizationItems.delete"
	show-actions
	:columns="[ 'name', { name: 'sortOrder', width: '8em' } ]"
	:data="organizationItems"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		em OE-Kategorie
		br
		| Name (Kürzel)
	template(#name-body="{ item }")
		em {{ item.organizationType.name }} ({{ item.organizationType.code }})
		br
		| {{ item.displayName }}
		template(v-if="item.inactive || item.dissolvedAt")
			br
			OrganizationItemStatusBadge(
				:dissolved-at="item.dissolvedAt"
				:inactive="item.inactive"
			)
	template(#sortOrder-header)
		| Sortierung
	template(#sortOrder-body="{ item }")
		| {{ item.sortOrder }}
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to="{ name: 'organizationItems-organizationItem', params: { organizationItem: item.id } }"
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
OrganizationItemEditor(
	v-if="canManage"
	ref="editor"
	@refresh="refresh"
)
</template>
