<script setup lang="ts">
import type { BudgetPeriodType } from '~/types'

const id = useId()
const model = defineModel<BudgetPeriodType>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Art der Haushaltsperiode
	BudgetPeriodTypeSelect(
		:id="id"
		v-model="model"
	)
</template>
