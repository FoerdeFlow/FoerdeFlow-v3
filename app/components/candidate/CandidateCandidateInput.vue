<script setup lang="ts">
import type { Person } from '~/types'

const id = useId()

const model = defineModel<Person>({
	required: true,
})

const props = defineProps<{
	readonly?: boolean
}>()
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Kandidat*in
	PersonSelect(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
	)
</template>
