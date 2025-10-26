<script setup lang="ts">
const id = useId()

const model = defineModel<'pending' | 'completed' | 'failed' | null>()
const props = defineProps<{
	type: 'comment' | 'approval' | 'task'
}>()

const items = computed(() => ({
	comment: [
		{ value: 'pending', label: 'Ausstehend' },
		{ value: 'completed', label: 'Abgeschlossen' },
	],
	approval: [
		{ value: 'pending', label: 'Ausstehend' },
		{ value: 'completed', label: 'Genehmigt' },
		{ value: 'failed', label: 'Abgelehnt' },
	],
	task: [
		{ value: 'pending', label: 'Ausstehend' },
		{ value: 'completed', label: 'Erledigt' },
	],
}[props.type]))
</script>

<template lang="pug">
fieldset.kern-fieldset
	legend.kern-label Status des Prozessschritts
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
