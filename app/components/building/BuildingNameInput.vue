<script setup lang="ts">
const id = useId()
const model = defineModel<string>()
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Funktion
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		type="text"
	)
</template>
