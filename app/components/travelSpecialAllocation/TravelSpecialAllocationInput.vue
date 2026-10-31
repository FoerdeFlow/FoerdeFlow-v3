<script setup lang="ts">
import type { TravelSpecialAllocation } from '~/types'

const id = useId()

const props = defineProps<{
	readonly?: boolean
	/** The codes of the entries that may be picked, all if not given. */
	allowedCodes?: string[] | null
}>()

const model = defineModel<TravelSpecialAllocation>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Sonderzuweisung (optional)
	TravelSpecialAllocationSelect(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
		:allowed-codes="props.allowedCodes"
	)
</template>
