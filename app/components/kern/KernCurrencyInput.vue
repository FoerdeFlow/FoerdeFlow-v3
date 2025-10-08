<script setup lang="ts">
const props = defineProps<{
	id: string
}>()

const model = defineModel<number | null>({
	required: true,
})
</script>

<template lang="pug">
input.kern-form-input__input(
	:id="props.id"
	v-model.number="model"
	type="text"
	inputmode="numeric"
  )
</template>
