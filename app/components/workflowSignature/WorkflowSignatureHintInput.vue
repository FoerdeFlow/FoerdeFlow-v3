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
	) Hinweistext im PDF #[span.kern-label__optional - Optional]
	div.kern-hint(
		:id="`${id}-hint`"
	) Wird über den Unterschriftenzeilen gedruckt, etwa zur Rücksendeadresse.
	textarea.kern-form-input__input(
		:id="id"
		v-model="model"
		:aria-describedby="`${id}-hint`"
	)
</template>
