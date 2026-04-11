<script setup lang="ts">
const props = defineProps<{
	id: string
}>()

const model = defineModel<number | null>({
	required: true,
})

const unit = ref(1)

const unitModel = computed({
	get: () => (model.value ?? 0) / unit.value,
	set: (value) => {
		model.value = value * unit.value
	},
})
</script>

<template lang="pug">
.kern-container-fluid
	.kern-row
		.kern-col
			input.kern-form-input__input(
				:id="props.id"
				v-model="unitModel"
				type="text"
				inputmode="numeric"
			)
		.kern-col
			.kern-form-input__select-wrapper
				select.kern-form-input__select(v-model.number="unit")
					option(value="1") Sekunden
					option(value="60") Minuten
					option(value="3600") Stunden
					option(value="86400") Tage
</template>
