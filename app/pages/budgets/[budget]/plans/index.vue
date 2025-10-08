<script setup lang="ts">
import { FetchError } from 'ofetch'
import { BudgetPlanEditor } from '#components'

const authStore = useAuthStore()
const confirmDialogStore = useConfirmDialogStore()
const alertStore = useAlertStore()
const { t } = useI18n()

const route = useRoute('budgets-budget-plans')

const { data: budgetData } = useFetch(`/api/budgets/${route.params.budget}`)

const { data, refresh } = useFetch('/api/budgetPlans', {
	query: {
		budget: route.params.budget,
	},
	default: () => [],
})

const editor = useTemplateRef<typeof BudgetPlanEditor>('editor')

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
		title: t('budgetPlan.remove.title'),
		text: t('budgetPlan.remove.text'),
	})) {
		try {
			await $fetch(`/api/budgetPlans/${id}`, { method: 'DELETE' })
			await refresh()
		} catch(e: unknown) {
			if(e instanceof FetchError) {
				alertStore.showAlert({
					type: 'danger',
					title: t('budgetPlan.remove.error.title'),
					text: e.data?.message ?? t('budgetPlan.remove.error.message'),
				})
			}
		}
	}
}

const scope = computed(() => ({ organizationItem: budgetData.value?.organizationItem.id ?? '' }))
</script>

<template lang="pug">
aside
	NuxtLink.kern-link(
		:to="{ name: 'budgets-budget', params: { budget: route.params.budget } }"
	)
		span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
		| Zurück zum Haushalt
h1.kern-heading-large {{ $t('budgetPlan.title') }}
KernTable(
	:caption="$t('budgetPlan.table.caption')"
	create-permission="budgetPlans.create"
	update-permission="budgetPlans.update"
	delete-permission="budgetPlans.delete"
	:columns="[ 'period' ]"
	:data="data ?? []"
	:scope="scope"
	show-actions
	@create="create"
	@edit="edit"
	@remove="remove"
)
	template(#period-header)
		| {{ $t('budgetPlan.field.period') }}
	template(#period-body="{ item }")
		| {{ formatDate(item.startDate, 'compact') }} - {{ formatDate(item.endDate, 'compact') }}
	template(#actions="{ item }")
		button.kern-btn.kern-btn--tertiary(
			v-if="!authStore.hasPermission('budgetPlans.update', scope).value"
			@click="edit(item)"
		)
			span.kern-icon.kern-icon--visibility(aria-hidden="true")
			span.kern-label.kern-sr-only Anzeigen
BudgetPlanEditor(
	ref="editor"
	:budget="route.params.budget"
	:readonly="!authStore.hasPermission('budgetPlans.update', scope).value"
	@refresh="refresh"
)
</template>
