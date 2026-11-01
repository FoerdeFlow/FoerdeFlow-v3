<script setup lang="ts">
import type { DestructureArray } from '#shared/types'

const props = defineProps<{
	id: string
	readonly?: boolean
	/**
	 * The transport mode whose reasons are offered. `null` offers none, as no
	 * mode is picked yet; left out, the reasons of all modes are offered.
	 */
	transportMode?: string | null
	/** The role of the journey, a reason restricted to other roles is not offered. */
	role?: string | null
}>()

// All reasons are fetched once and narrowed down here, so that a reason already
// picked can still be shown when the transport mode changes.
const { data } = await useFetch('/api/travelTransportReasons')

const model = defineModel<DestructureArray<typeof data.value> | null>({
	required: true,
})

/*
 * Without a transport mode there is nothing to choose from. An entry already
 * picked stays offered, disabled, even if it no longer fits the mode, so that
 * the field keeps showing what was chosen.
 */
const fitsMode = (item: DestructureArray<typeof data.value>) => props.transportMode !== null &&
	(props.transportMode === undefined ||
		item.transportModes.some((transportMode) => transportMode.id === props.transportMode))

const fitsRole = (item: DestructureArray<typeof data.value>) => !props.role ||
	item.roles.length === 0 || item.roles.some((role) => role.id === props.role)

const items = computed(() => (data.value ?? [])
	.map((item) => ({
		...item,
		disabled: !fitsMode(item) || !fitsRole(item),
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
