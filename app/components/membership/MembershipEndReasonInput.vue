<script setup lang="ts">
import type { MembershipEndReason } from '~/types'

const id = useId()
const model = defineModel<MembershipEndReason>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Grund des Ausscheidens #[span.kern-label__optional - Optional]
	MembershipEndReasonSelect(
		:id="id"
		v-model="model"
	)
</template>
