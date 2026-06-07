<script setup lang="ts">
import type { TextEditor } from '#components'

const route = useRoute('organizationItems-organizationItem-texts')
const confirmDialogStore = useConfirmDialogStore()

const { data: organizationItem } =
	useFetch(() => `/api/organizationItems/${route.params.organizationItem}`, {
		default: () => ({ code: '', name: '' }),
	})

const { data, refresh } =
	useFetch(() => `/api/texts?organizationItem=${route.params.organizationItem}`)

const editor = useTemplateRef<InstanceType<typeof TextEditor>>('textEditor')

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
		title: 'Text entfernen',
		text: 'Möchten Sie diesen Text wirklich entfernen?',
	})) {
		await $fetch(`/api/texts/${id}`, {
			method: 'DELETE',
		})
		await refresh()
	}
}
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'organizationItems-organizationItem', params: { organizationItem: route.params.organizationItem } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zu: {{ organizationItem.name }} ({{ organizationItem.code }})
header
	h1.kern-heading-large Texte im {{ organizationItem.name }} ({{ organizationItem.code }})
KernTable(
	caption="Liste der Texte"
	create-permission="texts.create"
	update-permission="texts.update"
	delete-permission="texts.delete"
	:data="data || []"
	:columns="['author', 'title']"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#author-header)
		| Autor
	template(#author-body="{ item }")
		template(v-if="item.authorPerson")
			| {{ formatPerson(item.authorPerson) }}
		template(v-if="item.authorOrganizationItem")
			| {{ formatOrganizationItem(item.authorOrganizationItem) }}
	template(#title-header)
		| Titel
	template(#title-body="{ item }")
		| {{ item.title }}
TextEditor(
	ref="textEditor"
	:organization-item="route.params.organizationItem"
	@refresh="refresh"
)
</template>
