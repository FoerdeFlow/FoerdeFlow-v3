<script setup lang="ts">
const id = useId()
const model = defineModel<string | null>({
	required: true,
	set: (value) => {
		return value?.length === 0 ? null : value
	},
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Besondere Rolle #[span.kern-label__optional - Optional]
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		type="text"
	)
</template>
