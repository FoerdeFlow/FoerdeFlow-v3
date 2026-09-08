<script setup lang="ts">
import type { Budget } from '~/types'

const id = useId()
const props = defineProps<{
	/** The organization item whose budgets may be picked, if it is restricted. */
	organizationItem?: string | null
	readonly?: boolean
}>()
const model = defineModel<Budget>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Haushalt
	BudgetSelect(
		:id="id"
		v-model="model"
		:organization-item="props.organizationItem"
		:readonly="props.readonly"
	)
</template>
