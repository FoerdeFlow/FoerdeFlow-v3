<script setup lang="ts">
import type { DestructureArray } from '#shared/types'

const props = defineProps<{
	id: string
	readonly?: boolean
	/** The codes of the entries that may be picked, all if not given. */
	allowedCodes?: string[] | null
}>()

const { data } = await useFetch('/api/travelRoles')

const model = defineModel<DestructureArray<typeof data.value> | null>({
	required: true,
})

/*
 * Only the entries whose code is allowed are offered. An entry already picked
 * stays offered, disabled, so that the field keeps showing what was chosen.
 */
const items = computed(() => (data.value ?? [])
	.map((item) => ({
		...item,
		disabled: !!props.allowedCodes && !props.allowedCodes.includes(item.code),
	}))
	.filter((item) => !item.disabled || item.id === model.value?.id))

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
