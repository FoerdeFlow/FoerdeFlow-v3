<script setup lang="ts">
import type { UnwrapRef } from 'vue'

const props = defineProps<{
	id: string
}>()

const { data } = await useFetch('/api/buildings')

const model = defineModel<NonNullable<UnwrapRef<typeof data>>[number] | null>({
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
			disabled
			value=""
		) - Bitte wählen -
		template(v-if="data")
			option(
				v-for="item of data"
				:key="item.id"
				:value="item.id"
			) {{ formatBuilding(item) }}
</template>
