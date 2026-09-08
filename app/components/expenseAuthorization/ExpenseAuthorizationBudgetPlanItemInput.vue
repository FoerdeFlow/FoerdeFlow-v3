<script setup lang="ts">
import type { Budget, BudgetPlan, BudgetPlanItem } from '~/types'

const id = useId()

const props = defineProps<{
	budget?: Budget
	budgetPlan?: BudgetPlan
	/** Whether budget plans that are still being applied for may be picked. */
	pending?: boolean
	/** The organization item whose budgets may be picked, if it is restricted. */
	organizationItem?: string | null
	readonly?: boolean
}>()

const budgetModel = ref<Budget>(null)
watch(() => props.budget, (budget) => {
	budgetModel.value = budget ?? null
})

const budgetPlanModel = ref<BudgetPlan>(null)
watch(() => props.budgetPlan, (budgetPlan) => {
	budgetPlanModel.value = budgetPlan ?? null
})

/** The selected plan as long as it is still being applied for. */
const pendingPlan = computed(() =>
	budgetPlanModel.value && 'pending' in budgetPlanModel.value
		? budgetPlanModel.value
		: null,
)

const model = defineModel<BudgetPlanItem>({
	required: true,
})
watch(() => model.value, (item) => {
	if(!item) return
	// @ts-expect-error | Types do not match properly here
	budgetModel.value = item.plan.budget
	budgetPlanModel.value = item.plan
}, { immediate: true })

// The budget select clears itself once the restriction no longer offers what
// was picked, and the plan and the title below it then have nothing left to
// belong to.
watch(budgetModel, (budget) => {
	if(budget) return
	budgetPlanModel.value = null
	model.value = null
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="`${id}-budget`") Haushalt
	BudgetSelect(
		:id="`${id}-budget`"
		v-model="budgetModel"
		:organization-item="props.organizationItem"
		:readonly="props.readonly"
	)
.kern-form-input(v-if="budgetModel")
	label.kern-label(:for="`${id}-budget-plan`") Haushaltsplan
	BudgetPlanSelect(
		:id="`${id}-budget-plan`"
		v-model="budgetPlanModel"
		:budget="budgetModel.id"
		:pending="props.pending"
		:readonly="props.readonly"
	)
.kern-form-input(v-if="budgetPlanModel")
	label.kern-label(:for="`${id}-budget-plan-item`") Haushaltstitel
	BudgetPlanItemSelect(
		:id="`${id}-budget-plan-item`"
		v-model="model"
		:budget-plan="budgetPlanModel.id"
		:pending-plan="pendingPlan"
		:readonly="props.readonly"
	)
</template>
