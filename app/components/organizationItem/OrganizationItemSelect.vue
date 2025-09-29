<script setup lang="ts">
const props = defineProps<{
	id: string
}>()

const { data } = await useFetch('/api/organizationItems')

const flattenTree = <T extends {
	name: string,
	code: string,
	children: T[],
}>(tree: T[], prefix = ''): (T & { displayName: string })[] => tree.flatMap((item) => ([
	{
		...item,
		displayName: `${prefix}${item.name} (${item.code})`,
	},
	...flattenTree(item.children, `${prefix}— `),
]))
const items = computed(() => data.value ? flattenTree(data.value) : [])

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
		model.value = items.value.find(({ id }) => id === v) ?? null
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
			v-for="item of items"
			:key="item.id"
			:value="item.id"
		) {{ item.displayName }}
</template>
