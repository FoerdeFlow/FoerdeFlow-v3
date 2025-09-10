<script setup lang="ts">
import type { AttendanceStatus } from '~/types'

const id = useId()
const model = defineModel<AttendanceStatus>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Anwesenheitsstatus
	AttendanceStatusSelect(
		:id="id"
		v-model="model"
	)
</template>
