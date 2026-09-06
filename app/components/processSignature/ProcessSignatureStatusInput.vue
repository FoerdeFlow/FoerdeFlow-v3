<script setup lang="ts">
const id = useId()

const model = defineModel<'pending' | 'received' | null>()

const items = [
	{ value: 'pending', label: 'Ausstehend' },
	{ value: 'received', label: 'Eingegangen' },
]
</script>

<template lang="pug">
fieldset.kern-fieldset
	legend.kern-label Eingang der Unterschrift
	.kern-fieldset__body
		.kern-form-check(
			v-for="item of items"
			:key="item.value"
		)
			input.kern-form-check__radio(
				:id="`${id}-${item.value}`"
				v-model="model"
				type="radio"
				:name="id"
				:value="item.value"
			)
			label.kern-label(
				:for="`${id}-${item.value}`"
			) {{ item.label }}
</template>
