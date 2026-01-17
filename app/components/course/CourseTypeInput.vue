<script setup lang="ts">
import type { CourseType } from '~/types'

const id = useId()
const model = defineModel<CourseType>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Abschluss
	CourseTypeSelect(
		:id="id"
		v-model="model"
	)
</template>
