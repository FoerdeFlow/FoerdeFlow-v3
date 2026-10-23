<script setup lang="ts">
const props = defineProps<{
	id: string
	/** Makes the empty option selectable under this name, e.g. for a filter. */
	emptyLabel?: string
}>()

const { data } = await useFetch('/api/eventTypes')

const model = defineModel<{
	id: string
	code: string
	name: string
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
			:disabled="!props.emptyLabel"
			value=""
		) {{ props.emptyLabel ?? '- Bitte wählen -' }}
		option(
			v-for="item of data ?? []"
			:key="item.id"
			:value="item.id"
		) {{ formatEventType(item) }}
</template>
