<script setup lang="ts">
import type { Council, CourseType, Department } from '~/types'

const props = defineProps<{
	id: string
}>()

const { data } = await useFetch('/api/courses')

const model = defineModel<{
	id: string
	code: string
	name: string
	type: CourseType
	council: Council
	department: Department
} | null>({
	required: true,
})

const selectModel = computed({
	get: () => model.value?.id ?? '',
	set: (v) => {
		if(v === '') {
			model.value = null
			return
		}
		model.value = data.value?.find(({ id }) => id === v) ?? null
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
			v-for="item of data ?? []"
			:key="item.id"
			:value="item.id"
		) {{ formatCourse(item) }}
</template>
