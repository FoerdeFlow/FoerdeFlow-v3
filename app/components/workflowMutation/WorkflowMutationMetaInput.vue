<script setup lang="ts">
const model = defineModel<unknown>({
	required: true,
})
</script>

<template lang="pug">
KernJsonInput(
	v-model="model"
	label="Meta-JSON"
)
</template>
