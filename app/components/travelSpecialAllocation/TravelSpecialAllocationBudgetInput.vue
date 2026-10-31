<script setup lang="ts">
import type { Budget } from '~/types'

const id = useId()
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
	)
</template>
