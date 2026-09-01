<script setup lang="ts">
import type { Person } from '~/types'

const id = useId()

const props = defineProps<{
	readonly?: boolean
}>()

const model = defineModel<Person>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") {{ $t('representationAllowanceRecipient.input.person.label') }}
	PersonSelect(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
	)
</template>
