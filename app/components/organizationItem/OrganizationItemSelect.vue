<script setup lang="ts">
const props = defineProps<{
	id: string
	labelNull?: string
	filteredIds?: string[]
}>()

const { data } = await useFetch('/api/organizationItems')

const filterTreeItem = <T extends {
	id: string
	name: string
	code: string
	children: T[]
}>(item: T): boolean =>
	!props.filteredIds ||
	props.filteredIds.includes(item.id) ||
	item.children.some(filterTreeItem)

const flattenTree = <T extends {
	id: string
	name: string
	code: string
	children: T[]
}>(tree: T[], prefix = ''): (T & { displayName: string, disabled?: boolean })[] => tree
	.filter(filterTreeItem)
	.flatMap((item) => ([
		{
			...item,
			displayName: `${prefix}${item.name} (${item.code})`,
			disabled: props.filteredIds ? !props.filteredIds.includes(item.id) : false,
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
		) {{ props.labelNull || '- Bitte wählen -' }}
		option(
			v-for="item of items"
			:key="item.id"
			:value="item.id"
			:disabled="item.disabled"
		) {{ item.displayName }}
</template>
