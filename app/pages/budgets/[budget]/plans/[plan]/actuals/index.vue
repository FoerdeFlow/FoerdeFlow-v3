<script setup lang="ts">
const route = useRoute('budgets-budget-plans-plan-actuals')

const { data } = useFetch(`/api/budgetPlans/${route.params.plan}/actuals`)

const items = computed(() => data.value?.items ?? [])

type Column = 'revenues' | 'expenses' | 'authorized' | 'ordered'
	| 'actualRevenues' | 'actualExpenses' | 'remainingRevenues' | 'remainingExpenses'

const total = (key: Column) => currencySum(...items.value.map((item) => item[key]))
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
header.mb-8
	p.kern-preline {{ $t('budgetPlanActuals.title') }}
	h1.kern-heading-large {{ formatBudget(data?.budget ?? null) }}
	p.kern-body--large
		| Haushaltsperiode:
		| {{ formatDate(data?.startDate ?? null, 'compact') }} – {{ formatDate(data?.endDate ?? null, 'compact') }}
	p.kern-body {{ $t('budgetPlanActuals.hint') }}
KernTable(
	:caption="$t('budgetPlanActuals.table.caption')"
	:create-permission="null"
	:update-permission="null"
	:delete-permission="null"
	show-footer
	:columns=`[
		'item',
		{ name: 'revenues', class: 'numeric' },
		{ name: 'actualRevenues', class: 'numeric' },
		{ name: 'remainingRevenues', class: 'numeric' },
		{ name: 'expenses', class: 'numeric' },
		{ name: 'authorized', class: 'numeric' },
		{ name: 'ordered', class: 'numeric' },
		{ name: 'actualExpenses', class: 'numeric' },
		{ name: 'remainingExpenses', class: 'numeric' },
	]`
	:data="items"
)
	template(#item-header)
		| {{ $t('budgetPlanActuals.field.item') }}
	template(#item-body="{ item }")
		| {{ formatBudgetPlanItem(item) }}
	template(#item-footer)
		| {{ $t('budgetPlanActuals.total') }}
	template(#revenues-header)
		| {{ $t('budgetPlanActuals.field.plannedRevenues') }}
	template(#revenues-body="{ item }")
		| {{ formatCurrency(item.revenues) }}
	template(#revenues-footer)
		| {{ formatCurrency(total('revenues'), 'amount') }}
	template(#actualRevenues-header)
		| {{ $t('budgetPlanActuals.field.actualRevenues') }}
	template(#actualRevenues-body="{ item }")
		| {{ formatCurrency(item.actualRevenues) }}
	template(#actualRevenues-footer)
		| {{ formatCurrency(total('actualRevenues'), 'amount') }}
	template(#remainingRevenues-header)
		| {{ $t('budgetPlanActuals.field.remainingRevenues') }}
	template(#remainingRevenues-body="{ item }")
		| {{ formatCurrency(item.remainingRevenues) }}
	template(#remainingRevenues-footer)
		| {{ formatCurrency(total('remainingRevenues'), 'amount') }}
	template(#expenses-header)
		| {{ $t('budgetPlanActuals.field.plannedExpenses') }}
	template(#expenses-body="{ item }")
		| {{ formatCurrency(item.expenses) }}
	template(#expenses-footer)
		| {{ formatCurrency(total('expenses'), 'amount') }}
	template(#authorized-header)
		| {{ $t('budgetPlanActuals.field.authorized') }}
	template(#authorized-body="{ item }")
		| {{ formatCurrency(item.authorized) }}
	template(#authorized-footer)
		| {{ formatCurrency(total('authorized'), 'amount') }}
	template(#ordered-header)
		| {{ $t('budgetPlanActuals.field.ordered') }}
	template(#ordered-body="{ item }")
		| {{ formatCurrency(item.ordered) }}
	template(#ordered-footer)
		| {{ formatCurrency(total('ordered'), 'amount') }}
	template(#actualExpenses-header)
		| {{ $t('budgetPlanActuals.field.actualExpenses') }}
	template(#actualExpenses-body="{ item }")
		| {{ formatCurrency(item.actualExpenses) }}
	template(#actualExpenses-footer)
		| {{ formatCurrency(total('actualExpenses'), 'amount') }}
	template(#remainingExpenses-header)
		| {{ $t('budgetPlanActuals.field.remainingExpenses') }}
	template(#remainingExpenses-body="{ item }")
		//- Ein überzogener Titel fällt sonst in der Spalte nicht auf.
		span(:class="{ 'ff3-overdrawn': item.remainingExpenses < 0 }")
			| {{ formatCurrency(item.remainingExpenses) }}
	template(#remainingExpenses-footer)
		| {{ formatCurrency(total('remainingExpenses'), 'amount') }}
p.kern-body.mt-4(v-if="data")
	| {{ $t('budgetPlanActuals.reserve') }}:
	| {{ $t('bankTransaction.direction.credit') }} {{ formatCurrency(data.reserve.actualRevenues, 'amount') }},
	| {{ $t('bankTransaction.direction.debit') }} {{ formatCurrency(data.reserve.actualExpenses, 'amount') }}
</template>

<style scoped>
.ff3-overdrawn {
	color: var(--kern-color-feedback-danger);
	font-weight: 600;
}
</style>
