<script setup lang="ts">
import type { Course } from '~/types'

const id = useId()
const model = defineModel<Course>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Studiengang #[span.kern-label__optional - Optional]
	CourseSelect(
		:id="id"
		v-model="model"
	)
</template>
