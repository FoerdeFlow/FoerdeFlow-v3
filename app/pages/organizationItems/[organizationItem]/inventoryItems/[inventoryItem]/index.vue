<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { InventoryItemEditor, InventoryLoanEditor, InventoryLoanReturnDialog } from '#components'

const route = useRoute('organizationItems-organizationItem-inventoryItems-inventoryItem')
const authStore = useAuthStore()
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const { t } = useI18n()

const { data, refresh } = useFetch(() => `/api/inventoryItems/${route.params.inventoryItem}`, {
	default: () => ({
		id: '',
		inventoryNumber: null,
		name: '',
		description: null,
		location: null,
		organizationItem: null,
		loans: [],
	}),
})

const editor = useTemplateRef<typeof InventoryItemEditor>('editor')
const loanEditor = useTemplateRef<typeof InventoryLoanEditor>('loanEditor')
const returnDialog = useTemplateRef<typeof InventoryLoanReturnDialog>('returnDialog')

const scope = computed(() => ({
	organizationItem: route.params.organizationItem,
}))

const updateAllowed = authStore.hasPermission('inventoryItems.update', scope.value)
const deleteAllowed = authStore.hasPermission('inventoryItems.delete', scope.value)
const lendAllowed = authStore.hasPermission('inventoryLoans.create', scope.value)
const returnAllowed = authStore.hasPermission('inventoryLoans.update', scope.value)

const status = computed(() => getItemStatus(data.value))
const openLoan = computed(() => data.value.loans.find((loan) => !loan.returnedAt) ?? null)

const items = computed(() => [
	{
		key: t('inventoryItem.field.inventoryNumber'),
		value: data.value.inventoryNumber ?? '',
	},
	{
		key: t('inventoryItem.field.location'),
		value: data.value.location
			? formatLocation(data.value.location)
			: t('inventoryItem.field.locationOpen'),
	},
	// Nur solange der Gegenstand verliehen ist, steht hier, bei wem er liegt.
	...openLoan.value
		? [
			{ key: t('inventoryLoan.field.borrower'), value: formatPerson(openLoan.value.borrower) },
			{ key: t('inventoryLoan.field.dueAt'), value: formatDatetime(openLoan.value.dueAt) },
		]
		: [],
])

function edit() {
	if(!editor.value) return
	editor.value.edit(route.params.inventoryItem)
}

function lend() {
	if(!loanEditor.value) return
	loanEditor.value.create()
}

function editLoan({ id }: { id: string }) {
	if(!loanEditor.value) return
	loanEditor.value.edit(id)
}

function returnLoan() {
	if(!returnDialog.value || !openLoan.value) return
	returnDialog.value.open({ ...openLoan.value, item: data.value })
}

async function removeLoan({ id }: { id: string }) {
	if(!await confirmDialogStore.askConfirm({
		title: t('inventoryLoan.remove.title'),
		text: t('inventoryLoan.remove.text'),
	})) return
	try {
		await $fetch(`/api/inventoryLoans/${id}`, { method: 'DELETE' })
		await refresh()
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			alertStore.showAlert({
				type: 'danger',
				title: t('inventoryLoan.remove.error.title'),
				text: e.data?.message ?? t('inventoryLoan.remove.error.message'),
			})
		}
	}
}

async function remove() {
	if(!await confirmDialogStore.askConfirm({
		title: t('inventoryItem.remove.title'),
		text: t('inventoryItem.remove.text'),
	})) return
	try {
		await $fetch(`/api/inventoryItems/${route.params.inventoryItem}`, { method: 'DELETE' })
		await navigateTo({
			name: 'organizationItems-organizationItem-inventoryItems',
			params: { organizationItem: route.params.organizationItem },
		})
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
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to=`{
			name: 'organizationItems-organizationItem-inventoryItems',
			params: { organizationItem: route.params.organizationItem },
		}`
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zur Inventarübersicht
header
	p.kern-preline {{ $t('inventoryItem.title') }}
	h1.kern-heading-large {{ data.name }}
p.mb-4
	InventoryItemStatusBadge(:status="status")
dl.kern-description-list
	.kern-description-list-item(
		v-for="item of items"
		:key="item.key"
	)
		dt.kern-description-list-item__key {{ item.key }}
		dd.kern-description-list-item__value {{ item.value }}
section.mb-8(v-if="data.description")
	h2.kern-title {{ $t('inventoryItem.field.description') }}
	KernText(:text="data.description")
.kern-btn-wrapper
	button.kern-btn.kern-btn--primary(
		v-if="lendAllowed && !openLoan"
		@click="lend"
	)
		span.kern-icon.kern-icon--add(aria-hidden="true")
		span.kern-label {{ $t('inventoryLoan.create.action') }}
	button.kern-btn.kern-btn--primary(
		v-if="returnAllowed && openLoan"
		@click="returnLoan"
	)
		span.kern-icon.kern-icon--check(aria-hidden="true")
		span.kern-label {{ $t('inventoryLoan.return.action') }}
	button.kern-btn.kern-btn--secondary(
		v-if="updateAllowed"
		@click="edit"
	)
		span.kern-icon.kern-icon--edit(aria-hidden="true")
		span.kern-label Bearbeiten
	button.kern-btn.kern-btn--secondary(
		v-if="deleteAllowed"
		@click="remove"
	)
		span.kern-icon.kern-icon--delete(aria-hidden="true")
		span.kern-label Löschen
section.mt-8
	h2.kern-title {{ $t('inventoryItem.history.title') }}
	KernTable(
		:caption="$t('inventoryItem.history.caption')"
		:create-permission="null"
		update-permission="inventoryLoans.update"
		delete-permission="inventoryLoans.delete"
		:columns="[ 'borrower', 'lentAt', 'dueAt', 'returnedAt', 'status' ]"
		:data="data.loans"
		:scope="scope"
		@edit="editLoan"
		@remove="removeLoan"
	)
		template(#borrower-header)
			| {{ $t('inventoryLoan.field.borrower') }}
		template(#borrower-body="{ item }")
			| {{ formatPerson(item.borrower) }}
		template(#lentAt-header)
			| {{ $t('inventoryLoan.field.lentAt') }}
		template(#lentAt-body="{ item }")
			| {{ formatDatetime(item.lentAt, 'compact') }}
		template(#dueAt-header)
			| {{ $t('inventoryLoan.field.dueAt') }}
		template(#dueAt-body="{ item }")
			| {{ formatDatetime(item.dueAt, 'compact') }}
		template(#returnedAt-header)
			| {{ $t('inventoryLoan.field.returnedAt') }}
		template(#returnedAt-body="{ item }")
			| {{ item.returnedAt ? formatDatetime(item.returnedAt, 'compact') : '' }}
		template(#status-header)
			| {{ $t('inventoryLoan.field.status') }}
		template(#status-body="{ item }")
			InventoryLoanStatusBadge(:status="getLoanStatus(item)")
InventoryItemEditor(
	ref="editor"
	:organization-item="route.params.organizationItem"
	@refresh="refresh"
)
InventoryLoanEditor(
	ref="loanEditor"
	:organization-item="route.params.organizationItem"
	:item="data"
	@refresh="refresh"
)
InventoryLoanReturnDialog(
	ref="returnDialog"
	@refresh="refresh"
)
</template>
