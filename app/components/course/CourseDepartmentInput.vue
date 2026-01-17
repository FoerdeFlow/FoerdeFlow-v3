<script setup lang="ts">
import type { Department } from '~/types'

const id = useId()
const model = defineModel<Department>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Fachbereich
	DepartmentSelect(
		:id="id"
		v-model="model"
	)
</template>
