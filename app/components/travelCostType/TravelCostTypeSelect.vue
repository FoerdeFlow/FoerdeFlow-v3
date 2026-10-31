<script setup lang="ts">
import type { DestructureArray } from '#shared/types'

const props = defineProps<{
	id: string
	readonly?: boolean
}>()

const { data } = await useFetch('/api/travelCostTypes')

const model = defineModel<DestructureArray<typeof data.value> | null>({
	required: true,
})

const items = computed(() => (data.value ?? []).map((item) => ({ ...item, disabled: false })))

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
		:disabled="props.readonly"
	)
		option(
			value=""
		) - Bitte wählen -
		option(
			v-for="item of items"
			:key="item.id"
			:value="item.id"
			:disabled="item.disabled"
		) {{ formatTravelCoded(item) }}
</template>
