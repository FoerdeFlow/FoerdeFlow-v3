<script setup lang="ts">
const id = useId()
const model = defineModel<string>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Erläuterung
	textarea.kern-form-input__input(
		:id="id"
		v-model="model"
	)
</template>
