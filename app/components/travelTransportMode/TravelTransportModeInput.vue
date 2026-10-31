<script setup lang="ts">
import type { TravelTransportMode } from '~/types'

const id = useId()

const props = defineProps<{
	readonly?: boolean
}>()

const model = defineModel<TravelTransportMode>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Verkehrsmittel
	TravelTransportModeSelect(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
	)
</template>
