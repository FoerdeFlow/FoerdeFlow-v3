<script setup lang="ts">
import type { MembershipType } from '~/types'

const id = useId()
const model = defineModel<MembershipType>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Mitgliedschaftsart
	MembershipTypeSelect(
		:id="id"
		v-model="model"
	)
</template>
