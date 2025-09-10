<script setup lang="ts">
import type { DestructureArray } from '#shared/types'

const props = defineProps<{
	id: string
}>()

const { data } = useFetch('/api/rooms')

const model = defineModel<DestructureArray<typeof data.value> | null>({
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
		option(
			v-for="item of data"
			:key="item.id"
			:value="item.id"
		) {{ formatRoom(item) }}
</template>
