<script setup lang="ts">
import type { Course } from '~/types'

const id = useId()

const props = defineProps<{
	required?: boolean
}>()

const model = defineModel<Course>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Studiengang #[template(v-if="!props.required") #[span.kern-label__optional - Optional]]
	CourseSelect(
		:id="id"
		v-model="model"
	)
</template>
