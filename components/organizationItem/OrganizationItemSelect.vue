<script setup lang="ts">
const props = defineProps<{
	id: string
}>()
const model = defineModel<string | null>({
	required: true,
	get: (v) => v ?? '',
	set: (v) => v === '' ? null : v,
})

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
</script>

<template lang="pug">
.kern-form-input__select-wrapper
	select.kern-form-input__select(
		:id="props.id"
		v-model="model"
	)
		option(
			disabled
			value=""
		) - Bitte wählen -
		option(
			v-for="item of items"
			:key="item.id"
			:value="item.id"
		) {{ item.displayName }}
</template>
