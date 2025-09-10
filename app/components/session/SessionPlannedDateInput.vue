<script setup lang="ts">
const id = useId()
const model = defineModel<Date | null>({
	required: true,
})
</script>

<template lang="pug">
fieldset.kern-fieldset
	legend.kern-label Datum
	KernDateInput(
		:id="id"
		v-model="model"
		show-time
	)
</template>
