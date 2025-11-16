<script setup lang="ts">
import { FetchError } from 'ofetch'
import type { ExpenseAuthorizationEditor } from '#components'

const authStore = useAuthStore()
const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()
const { t } = useI18n()

const route = useRoute('budgets-budget-plans-plan-expenseAuthorizations')

const { data: budgetPlanData } = useFetch(`/api/budgetPlans/${route.params.plan}`)

const { data, refresh } = useFetch('/api/expenseAuthorizations', {
	query: {
		budgetPlan: route.params.plan,
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

const scope = computed(() => ({ organizationItem: budgetPlanData.value?.budget.organizationItem ?? '' }))

function openAsPdf({ id }: { id: string }) {
	window.open(`/api/expenseAuthorizations/${id}/pdf`, '_blank')
}
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to=`{
			name: 'budgets-budget-plans-plan',
			params: { budget: route.params.budget, plan: route.params.plan },
		}`
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zum Haushaltsplan
h1.kern-heading-large {{ $t('expenseAuthorization.title') }}
KernTable(
	:caption="$t('expenseAuthorization.table.caption')"
	create-permission="expenseAuthorizations.create"
	update-permission="expenseAuthorizations.update"
	delete-permission="expenseAuthorizations.delete"
	:columns="[ 'budgetPlanItem', 'title', 'amount' ]"
	:data="data ?? []"
	:scope="scope"
	show-actions
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#budgetPlanItem-header)
		| {{ $t('expenseAuthorization.field.budgetPlanItem') }}
	template(#budgetPlanItem-body="{ item }")
		| {{ item.budgetPlanItem.title }}
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
	:budget-plan="route.params.plan"
	:readonly="!authStore.hasPermission('expenseAuthorizations.update', scope).value"
	@refresh="refresh"
)
</template>
