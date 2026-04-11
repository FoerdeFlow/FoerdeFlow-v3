<script setup lang="ts">
const props = defineProps<{
	id: string
	readonly?: boolean
}>()

const { data } = await useFetch('/api/councils')

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
		:disabled="props.readonly"
	)
		option(
			disabled
			value=""
		)
			template(v-if="props.readonly")
				| - Wird automatisch eingetragen -
			template(v-else)
				| - Bitte wählen -
		option(
			v-for="item of data ?? []"
			:key="item.id"
			:value="item.id"
		) {{ formatCouncil(item) }}
</template>
