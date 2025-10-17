<script setup lang="ts">
const props = defineProps<{
	id: string
}>()

const data = [
	{ id: 'comment', name: 'Stellungnahme', code: 'S' },
	{ id: 'approval', name: 'Genehmigung', code: 'G' },
	{ id: 'task', name: 'Aufgabe', code: 'A' },
] as const

const model = defineModel<typeof data[number]['id'] | null>({
	required: true,
})

const selectModel = computed({
	get: () => model.value ?? '',
	set: (v) => {
		if(v === '') {
			model.value = null
			return
		}
		model.value = v
	},
})
</script>

<template lang="pug">
.kern-form-input__select-wrapper
	select.kern-form-input__select(
		:id="props.id"
		v-model="selectModel"
	)
		option(
			value=""
		) - Bitte wählen -
		option(
			v-for="item of data"
			:key="item.id"
			:value="item.id"
		) {{ item.name }} ({{ item.code }})
</template>
