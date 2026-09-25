<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { InventoryItemEditor } from '#components'

const route = useRoute('organizationItems-organizationItem-inventoryItems')
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const { t } = useI18n()

const { data, refresh } = useFetch('/api/inventoryItems', {
	query: { organizationItem: route.params.organizationItem },
	default: () => [],
})

const dialog = useTemplateRef<typeof InventoryItemEditor>('dialog')

function create() {
	if(!dialog.value) return
	dialog.value.create()
}

function edit({ id }: { id: string }) {
	if(!dialog.value) return
	dialog.value.edit(id)
}

async function remove({ id }: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: t('inventoryItem.remove.title'),
		text: t('inventoryItem.remove.text'),
	})) {
		try {
			await $fetch(`/api/inventoryItems/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: t('inventoryItem.remove.error.title'),
					text: e.data?.message ?? t('inventoryItem.remove.error.message'),
				})
			}
		}
	}
}

const scope = computed(() => ({
	organizationItem: route.params.organizationItem,
}))
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to=`{
			name: 'organizationItems-organizationItem',
			params: { organizationItem: route.params.organizationItem },
		}`
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zum Gremium
h1.kern-heading-large {{ $t('inventoryItem.title') }}
KernTable(
	:caption="$t('inventoryItem.table.caption')"
	create-permission="inventoryItems.create"
	update-permission="inventoryItems.update"
	delete-permission="inventoryItems.delete"
	show-actions
	:columns="[ 'inventoryNumber', 'name', 'location', 'status' ]"
	:data="data"
	:scope="scope"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#inventoryNumber-header)
		| {{ $t('inventoryItem.field.inventoryNumber') }}
	template(#inventoryNumber-body="{ item }")
		| {{ item.inventoryNumber ?? '' }}
	template(#name-header)
		| {{ $t('inventoryItem.field.name') }}
	template(#name-body="{ item }")
		| {{ item.name }}
	template(#location-header)
		| {{ $t('inventoryItem.field.location') }}
	template(#location-body="{ item }")
		| {{ item.location ? formatLocation(item.location) : $t('inventoryItem.field.locationOpen') }}
	template(#status-header)
		| {{ $t('inventoryItem.field.status') }}
	template(#status-body="{ item }")
		InventoryItemStatusBadge(:status="getItemStatus(item)")
		template(
			v-for="loan of item.loans"
			:key="loan.id"
		)
			br
			span {{ formatPerson(loan.borrower) }}
			span , {{ $t('inventoryLoan.field.dueAt') }} {{ formatDatetime(loan.dueAt, 'compact') }}
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to=`{
				name: 'organizationItems-organizationItem-inventoryItems-inventoryItem',
				params: { organizationItem: route.params.organizationItem, inventoryItem: item.id },
			}`
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
InventoryItemEditor(
	ref="dialog"
	:organization-item="route.params.organizationItem"
	@refresh="refresh"
)
</template>
