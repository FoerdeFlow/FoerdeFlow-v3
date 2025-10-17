<script setup lang="ts">
const id = useId()
const model = defineModel<number>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Schritt
	input.kern-form-input__input(
		:id="id"
		v-model.number="model"
		type="text"
		inputmode="numeric"
	)
</template>
