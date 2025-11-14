<script setup lang="ts">
import type { DocumentType } from '~/types'

const id = useId()
const model = defineModel<DocumentType>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Art der Vorlage
	DocumentTypeSelect(
		:id="id"
		v-model="model"
	)
</template>
