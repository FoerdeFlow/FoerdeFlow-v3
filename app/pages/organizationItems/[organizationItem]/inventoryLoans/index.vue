<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { InventoryLoanEditor, InventoryLoanReturnDialog } from '#components'

const route = useRoute('organizationItems-organizationItem-inventoryLoans')
const authStore = useAuthStore()
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const { t } = useI18n()

const statusFilter = ref<'open' | 'overdue' | 'returned' | 'all'>('open')

const { data, refresh } = useFetch('/api/inventoryLoans', {
	query: computed(() => ({
		organizationItem: route.params.organizationItem,
		status: statusFilter.value,
	})),
	default: () => [],
})

const dialog = useTemplateRef<typeof InventoryLoanEditor>('dialog')
const returnDialog = useTemplateRef<typeof InventoryLoanReturnDialog>('returnDialog')

function create() {
	if(!dialog.value) return
	dialog.value.create()
}

function edit({ id }: { id: string }) {
	if(!dialog.value) return
	dialog.value.edit(id)
}

function returnLoan(loan: { returnedAt: string | null }) {
	if(!returnDialog.value || loan.returnedAt) return
	returnDialog.value.open(loan)
}

async function remove({ id }: { id: string }) {
	if(await confirmDialogStore.askConfirm({
		title: t('inventoryLoan.remove.title'),
		text: t('inventoryLoan.remove.text'),
	})) {
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
}

const filterId = useId()

const scope = computed(() => ({
	organizationItem: route.params.organizationItem,
}))

// Die Rückgabe steht im Aktionsslot, den KernTable ungeprüft durchreicht: die
// Berechtigung dafür gehört deshalb hierher.
const returnAllowed = authStore.hasPermission('inventoryLoans.update', scope.value)
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
h1.kern-heading-large {{ $t('inventoryLoan.title') }}
.kern-form-input
	label.kern-label(:for="filterId") {{ $t('inventoryLoan.filter.label') }}
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="filterId"
			v-model="statusFilter"
		)
			option(value="open") {{ $t('inventoryLoan.filter.open') }}
			option(value="overdue") {{ $t('inventoryLoan.filter.overdue') }}
			option(value="returned") {{ $t('inventoryLoan.filter.returned') }}
			option(value="all") {{ $t('inventoryLoan.filter.all') }}
KernTable(
	:caption="$t('inventoryLoan.table.caption')"
	create-permission="inventoryLoans.create"
	update-permission="inventoryLoans.update"
	delete-permission="inventoryLoans.delete"
	:columns="[ 'item', 'borrower', 'lentAt', 'dueAt', 'status' ]"
	:data="data"
	:scope="scope"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#item-header)
		| {{ $t('inventoryLoan.field.item') }}
	template(#item-body="{ item }")
		NuxtLink.kern-link(
			:to=`{
				name: 'organizationItems-organizationItem-inventoryItems-inventoryItem',
				params: { organizationItem: route.params.organizationItem, inventoryItem: item.item.id },
			}`
		) {{ formatInventoryItem(item.item) }}
	template(#borrower-header)
		| {{ $t('inventoryLoan.field.borrower') }}
	template(#borrower-body="{ item }")
		PersonLink(:person="item.borrower")
	template(#lentAt-header)
		| {{ $t('inventoryLoan.field.lentAt') }}
	template(#lentAt-body="{ item }")
		| {{ formatDatetime(item.lentAt, 'compact') }}
	template(#dueAt-header)
		| {{ $t('inventoryLoan.field.dueAt') }}
	template(#dueAt-body="{ item }")
		| {{ formatDatetime(item.dueAt, 'compact') }}
		template(v-if="item.returnedAt")
			br
			span {{ $t('inventoryLoan.field.returnedAt') }}: {{ formatDatetime(item.returnedAt, 'compact') }}
	template(#status-header)
		| {{ $t('inventoryLoan.field.status') }}
	template(#status-body="{ item }")
		InventoryLoanStatusBadge(:status="getLoanStatus(item)")
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			v-if="returnAllowed && !item.returnedAt"
			@click="returnLoan(item)"
		)
			span.kern-icon.kern-icon--check(aria-hidden="true")
			span.kern-label.kern-sr-only {{ $t('inventoryLoan.return.action') }}
InventoryLoanEditor(
	ref="dialog"
	:organization-item="route.params.organizationItem"
	@refresh="refresh"
)
InventoryLoanReturnDialog(
	ref="returnDialog"
	@refresh="refresh"
)
</template>
