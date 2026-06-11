<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { ExpenseAuthorizationEditor } from '#components'

const authStore = useAuthStore()
const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()
const { t } = useI18n()

const route = useRoute('budgets-budget-expenseAuthorizations')

const { data: budgetData } = useFetch(`/api/budgets/${route.params.budget}`)

const { data, refresh } = useFetch('/api/expenseAuthorizations', {
	query: {
		budget: route.params.budget,
	},
	default: () => [],
})

const editor = useTemplateRef<typeof ExpenseAuthorizationEditor>('editor')

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
		title: t('expenseAuthorization.remove.title'),
		text: t('expenseAuthorization.remove.text'),
	})) {
		try {
			await $fetch(`/api/expenseAuthorizations/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: t('expenseAuthorization.remove.error.title'),
					text: e.data?.message ?? t('expenseAuthorization.remove.error.message'),
				})
			}
		}
	}
}

const scope = computed(() => ({ organizationItem: budgetData.value?.organizationItem ?? '' }))

function openAsPdf({ id }: { id: string }) {
	window.open(`/api/expenseAuthorizations/${id}/pdf`, '_blank')
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
h1.kern-heading-large {{ $t('expenseAuthorization.title') }}
KernTable(
	:caption="$t('expenseAuthorization.table.caption')"
	create-permission="expenseAuthorizations.create"
	update-permission="expenseAuthorizations.update"
	delete-permission="expenseAuthorizations.delete"
	:columns="[ 'title', 'amount' ]"
	:data="data ?? []"
	:scope="scope"
	show-actions
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#title-header)
		| {{ $t('expenseAuthorization.field.title') }}
	template(#title-body="{ item }")
		| {{ item.title }}
	template(#amount-header)
		| {{ $t('expenseAuthorization.field.amount') }}
	template(#amount-body="{ item }")
		| {{ formatCurrency(item.amount) }}
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			v-if="!authStore.hasPermission('expenseAuthorizations.update', scope).value"
			@click="edit(item)"
		)
			span.kern-icon.kern-icon--visibility(aria-hidden="true")
			span.kern-label.kern-sr-only Anzeigen
		button.kern-btn.kern-btn--tertiary(
			@click="openAsPdf(item)"
		)
			span.kern-icon.kern-icon--open-in-new(aria-hidden="true")
			span.kern-label.kern-sr-only Als PDF öffnen
ExpenseAuthorizationEditor(
	ref="editor"
	type="reserve"
	:budget="route.params.budget"
	:readonly="!authStore.hasPermission('expenseAuthorizations.update', scope).value"
	@refresh="refresh"
)
</template>
