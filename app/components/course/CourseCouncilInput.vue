<script setup lang="ts">
import type { Council } from '~/types'

const id = useId()
const model = defineModel<Council>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Fachschaft
	CouncilSelect(
		:id="id"
		v-model="model"
	)
</template>
