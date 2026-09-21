<script setup lang="ts">
import type { EventType } from '~/types'

const id = useId()
const model = defineModel<EventType>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('event.input.type.label') }}
	EventTypeSelect(
		:id="id"
		v-model="model"
	)
</template>
