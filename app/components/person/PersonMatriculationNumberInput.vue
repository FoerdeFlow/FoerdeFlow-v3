<script setup lang="ts">
const id = useId()
const model = defineModel<number | null>({
	required: true,
	set: (value) => {
		return value === 0 || value as unknown as string === '' ? null : Number(value)
	},
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Matrikelnummer #[span.kern-label__optional - Optional]
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		type="text"
		inputmode="numeric"
		minlength="6"
		maxlength="7"
	)
</template>
