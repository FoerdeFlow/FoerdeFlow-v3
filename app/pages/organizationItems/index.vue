<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { OrganizationItemEditor } from '#components'
import type { DestructureArray } from '#shared/types'

const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const { data, refresh } = useFetch('/api/organizationItems')

type TreeItem = DestructureArray<typeof data.value>
const flattenTree = (tree: TreeItem[], prefix = ''): (TreeItem & { displayName: string })[] => tree.flatMap((item) => ([
	{
		...item,
		displayName: `${prefix}${item.name} (${item.code})`,
	},
	...flattenTree(item.children, `${prefix}— `),
]))
const organizationItems = computed(() => data.value ? flattenTree(data.value) : [])

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
KernTable(
	caption="Liste der Organisationseinheiten"
	create-permission="organizationItems.create"
	update-permission="organizationItems.update"
	delete-permission="organizationItems.delete"
	show-actions
	:columns="[ 'name' ]"
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
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to="{ name: 'organizationItems-organizationItem', params: { organizationItem: item.id } }"
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
OrganizationItemEditor(
	ref="editor"
	@refresh="refresh"
)
</template>
