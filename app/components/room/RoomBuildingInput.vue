<script setup lang="ts">
import type { Building } from '~/types'

const id = useId()
const model = defineModel<Building>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Gebäude
	BuildingSelect(
		:id="id"
		v-model="model"
	)
</template>
