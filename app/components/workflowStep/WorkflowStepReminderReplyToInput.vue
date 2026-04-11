<script setup lang="ts">
const id = useId()
const model = defineModel<string | null>({
	required: true,
	get: (v) => v ?? '',
	set: (v) => v === '' ? null : v,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) Antwortadresse #[span.kern-label__optional - Optional]
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		type="email"
		autocomplete="email"
	)
</template>
