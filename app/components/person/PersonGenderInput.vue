<script setup lang="ts">
import type { Gender } from '~/types'

const id = useId()
const model = defineModel<Gender>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Geschlecht #[span.kern-label__optional - Optional]
	GenderSelect(
		:id="id"
		v-model="model"
	)
</template>
