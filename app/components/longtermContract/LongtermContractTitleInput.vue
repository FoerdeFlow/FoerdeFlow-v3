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
	) {{ $t('longtermContract.input.title.label') }}
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		type="text"
	)
</template>
