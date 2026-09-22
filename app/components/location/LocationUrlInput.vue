<script setup lang="ts">
const id = useId()
const maxLength = 1024
const model = defineModel<string>()
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('location.input.url.label') }}
	input.kern-form-input__input(
		:id="id"
		v-model="model"
		type="url"
		:maxlength="maxLength"
	)
	p.kern-form-input__hint {{ $t('location.input.url.hint') }}
</template>
