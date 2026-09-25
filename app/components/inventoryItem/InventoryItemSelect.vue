<script setup lang="ts">
import type { DestructureArray } from '#shared/types'

const props = defineProps<{
	id: string
	organizationItem: string
}>()

const { data } = await useFetch('/api/inventoryItems', {
	query: computed(() => ({ organizationItem: props.organizationItem })),
})

const model = defineModel<DestructureArray<typeof data.value> | null>({
	required: true,
})

// Ein verliehener Gegenstand steht nicht zur Wahl: er kann kein zweites Mal
// herausgegeben werden, solange er nicht zurück ist.
const items = computed(() => (data.value ?? [])
	.filter((item) => getItemStatus(item) === 'available' || item.id === model.value?.id)
	.sort((a, b) => formatInventoryItem(a).localeCompare(formatInventoryItem(b))),
)

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
		) {{ $t('inventoryItem.select.placeholder') }}
		option(
			v-for="item of items"
			:key="item.id"
			:value="item.id"
		) {{ formatInventoryItem(item) }}
</template>
