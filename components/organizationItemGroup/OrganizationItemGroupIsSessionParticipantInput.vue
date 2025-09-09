<script setup lang="ts">
const id = useId()
const model = defineModel<boolean>()
</script>

<template lang="pug">
.kern-form-check
	input.kern-form-check__checkbox(
		:id="id"
		v-model="model"
		type="checkbox"
	)
	label.kern-label(
		:for="id"
	) Sitzungsteilnahme erforderlich?
</template>
