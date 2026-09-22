<script setup lang="ts">
const id = useId()
const model = defineModel<number | null>({
	required: true,
})

// Eine unbekannte Kapazität ist nicht dasselbe wie null Plätze.
const inputModel = computed({
	get: () => model.value === null ? '' : String(model.value),
	set: (value: string) => {
		const parsed = Number.parseInt(value, 10)
		model.value = Number.isFinite(parsed) ? parsed : null
	},
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(
		:for="id"
	) {{ $t('location.input.capacity.label') }}
	input.kern-form-input__input(
		:id="id"
		v-model="inputModel"
		type="text"
		inputmode="numeric"
	)
	p.kern-form-input__hint {{ $t('location.input.capacity.hint') }}
</template>
