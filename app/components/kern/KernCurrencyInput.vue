<script setup lang="ts">
const props = defineProps<{
	id: string
}>()

// string is used for readonly mode where the formatted currency string is shown
const model = defineModel<number | string | null>({
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
