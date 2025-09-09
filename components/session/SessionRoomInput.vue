<script setup lang="ts">
import type { Room } from '~/types'

const id = useId()
const model = defineModel<Room>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Raum
	RoomSelect(
		:id="id"
		v-model="model"
	)
</template>
