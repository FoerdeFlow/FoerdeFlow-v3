<script setup lang="ts">
const props = defineProps<{
	id: string
}>()

const data = [
	{ id: 'present', label: 'Anwesend' },
	{ id: 'absent', label: 'Unentschuldigt' },
	{ id: 'excused', label: 'Entschuldigt' },
	{ id: 'late', label: 'Verspätet' },
] as const

const model = defineModel<typeof data[number]['id'] | null>({
	required: true,
})

const selectModel = computed({
	get: () => model.value ?? '',
	set: (v) => {
		model.value = v === '' ? null : v
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
			disabled
			value=""
		) - Bitte wählen -
		option(
			v-for="item of data"
			:key="item.id"
			:value="item.id"
		) {{ item.label }}
</template>
