<script setup lang="ts">
const id = useId()
const model = defineModel<number | null>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input.kern-form-input__input--width-4
	label.kern-label(
		:for="id"
	) Lfd.
	input.kern-form-input__input(
		:id="id"
		v-model.number="model"
		type="text"
		inputmode="numeric"
	)
</template>
