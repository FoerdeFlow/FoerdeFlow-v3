<script setup lang="ts">
import type { TravelCostType } from '~/types'

const id = useId()

const props = defineProps<{
	readonly?: boolean
}>()

const model = defineModel<TravelCostType>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Kostenart
	TravelCostTypeSelect(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
	)
</template>
