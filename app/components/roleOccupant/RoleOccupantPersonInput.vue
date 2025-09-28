<script setup lang="ts">
import type { Person } from '~/types'

const id = useId()

const model = defineModel<Person>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Person
	PersonSelect(
		:id="id"
		v-model="model"
	)
</template>
