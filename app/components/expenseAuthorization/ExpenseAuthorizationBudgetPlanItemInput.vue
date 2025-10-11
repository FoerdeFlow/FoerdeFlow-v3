<script setup lang="ts">
import type { BudgetPlanItem } from '~/types'

const id = useId()

const props = defineProps<{
	budgetPlan: string
}>()

const model = defineModel<BudgetPlanItem>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Haushaltstitel
	BudgetPlanItemSelect(
		:id="id"
		v-model="model"
		:budget-plan="props.budgetPlan"
	)
</template>
