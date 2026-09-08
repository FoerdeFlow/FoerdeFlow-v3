<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { PaymentOrderEditor } from '#components'

const authStore = useAuthStore()
const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()
const { t } = useI18n()

const route = useRoute('budgets-budget-paymentOrders')

const { data: budgetData } = useFetch(`/api/budgets/${route.params.budget}`)

const { data, refresh } = useFetch('/api/paymentOrders', {
	query: {
		budget: route.params.budget,
	},
	default: () => [],
})

const editor = useTemplateRef<typeof PaymentOrderEditor>('editor')

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
		title: t('paymentOrder.remove.title'),
		text: t('paymentOrder.remove.text'),
	})) {
		try {
			await $fetch(`/api/paymentOrders/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: t('paymentOrder.remove.error.title'),
					text: e.data?.message ?? t('paymentOrder.remove.error.message'),
				})
			}
		}
	}
}

const scope = computed(() => ({ organizationItem: budgetData.value?.organizationItem.id ?? '' }))

function openAsPdf({ id }: { id: string }) {
	window.open(`/api/paymentOrders/${id}/pdf`, '_blank')
}
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to=`{
			name: 'budgets-budget',
			params: { budget: route.params.budget },
		}`
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zum Haushalt
h1.kern-heading-large {{ $t('paymentOrder.title') }}
KernTable(
	:caption="$t('paymentOrder.table.caption')"
	create-permission="paymentOrders.create"
	update-permission="paymentOrders.update"
	delete-permission="paymentOrders.delete"
	:columns="[ 'title', 'recipient', 'amount' ]"
	:data="data ?? []"
	:scope="scope"
	show-actions
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#title-header)
		| {{ $t('paymentOrder.field.title') }}
	template(#title-body="{ item }")
		| {{ item.title }}
	template(#recipient-header)
		| {{ $t('paymentOrder.field.recipient') }}
	template(#recipient-body="{ item }")
		| {{ formatPaymentOrderRecipient(item) }}
	template(#amount-header)
		| {{ $t('paymentOrder.field.amount') }}
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.amount) }}
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			v-if="!authStore.hasPermission('paymentOrders.update', scope).value"
			@click="edit(item)"
		)
			span.kern-icon.kern-icon--visibility(aria-hidden="true")
			span.kern-label.kern-sr-only Anzeigen
		button.kern-btn.kern-btn--tertiary(
			@click="openAsPdf(item)"
		)
			span.kern-icon.kern-icon--open-in-new(aria-hidden="true")
			span.kern-label.kern-sr-only Als PDF öffnen
PaymentOrderEditor(
	ref="editor"
	type="reserve"
	:budget="budgetData"
	:readonly="!authStore.hasPermission('paymentOrders.update', scope).value"
	@refresh="refresh"
)
</template>
