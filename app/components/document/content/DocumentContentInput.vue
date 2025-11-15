<script setup lang="ts">
const id = useId()
const model = defineModel<File | null>()

function onChange(event: Event) {
	model.value = (event.target as HTMLInputElement).files?.[0] ?? null
}
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Datei hochladen
	.kern-hint(:id="`${id}-hint`") Erlaubte Formate: PDF. Maximale Dateigröße sind 100 MB.
	input.kern-form-input__input(
		:id="id"
		type="file"
		accept="application/pdf"
		:aria-describedby="`${id}-hint`"
		@change="onChange"
	)
</template>
