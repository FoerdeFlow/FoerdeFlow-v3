<script setup lang="ts">
import type { WorkflowStepType } from '~/types'

const id = useId()
const model = defineModel<WorkflowStepType>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Art des Schritts #[span.kern-label__optional - Optional]
	WorkflowStepTypeSelect(
		:id="id"
		v-model="model"
	)
</template>
