<script setup lang="ts">
const id = useId()
const model = defineModel<File | null>()

function onChange(event: Event) {
	model.value = (event.target as HTMLInputElement).files?.[0] ?? null
}
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Bild hochladen
	.kern-hint(:id="`${id}-hint`") Erlaubte Formate: JPEG, PNG, WEBP. Maximale Dateigröße sind 20 MB.
	input.kern-form-input__input(
		:id="id"
		type="file"
		accept="image/jpeg,image/png,image/webp"
		:aria-describedby="`${id}-hint`"
		@change="onChange"
	)
</template>
