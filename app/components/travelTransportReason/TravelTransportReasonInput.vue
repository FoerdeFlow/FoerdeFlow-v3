<script setup lang="ts">
import type { TravelTransportReason } from '~/types'

const id = useId()

const props = defineProps<{
	readonly?: boolean
	/** The transport mode whose reasons are offered, see the select. */
	transportMode?: string | null
	/** The role of the journey, see the select. */
	role?: string | null
}>()

const model = defineModel<TravelTransportReason>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Grund für die Wahl des Verkehrsmittels
	TravelTransportReasonSelect(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
		:transport-mode="props.transportMode"
		:role="props.role"
	)
</template>
