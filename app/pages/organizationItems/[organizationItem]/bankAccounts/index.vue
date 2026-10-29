<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { BankAccountEditor } from '#components'

const route = useRoute('organizationItems-organizationItem-bankAccounts')
const alertStore = useAlertStore()
const confirmDialogStore = useConfirmDialogStore()
const { t } = useI18n()

const { data, refresh } = useFetch('/api/bankAccounts', {
	query: { organizationItem: route.params.organizationItem },
	default: () => [],
})

const dialog = useTemplateRef<typeof BankAccountEditor>('dialog')

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
		title: t('bankAccount.remove.title'),
		text: t('bankAccount.remove.text'),
	})) {
		try {
			await $fetch(`/api/bankAccounts/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: t('bankAccount.remove.error.title'),
					text: e.data?.message ?? t('bankAccount.remove.error.message'),
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
h1.kern-heading-large {{ $t('bankAccount.title') }}
KernTable(
	:caption="$t('bankAccount.table.caption')"
	create-permission="bankAccounts.create"
	update-permission="bankAccounts.update"
	delete-permission="bankAccounts.delete"
	show-actions
	:columns="[ 'name', 'iban' ]"
	:data="data"
	:scope="scope"
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#name-header)
		| {{ $t('bankAccount.field.name') }}
	template(#name-body="{ item }")
		| {{ item.name }}
	template(#iban-header)
		| {{ $t('bankAccount.field.iban') }}
	template(#iban-body="{ item }")
		| {{ formatIban(item.iban) }}
	template(#actions="{ item }")
		NuxtLink.kern-btn.kern-btn--tertiary(
			:to=`{
				name: 'organizationItems-organizationItem-bankAccounts-bankAccount',
				params: { organizationItem: route.params.organizationItem, bankAccount: item.id },
			}`
		)
			span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
			span.kern-label.kern-sr-only Aufrufen
BankAccountEditor(
	ref="dialog"
	:organization-item="route.params.organizationItem"
	@refresh="refresh"
)
</template>
