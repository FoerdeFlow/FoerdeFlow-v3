<script setup lang="ts">
const props = defineProps<{
	number: number
	title: string
	items: {
		key: string
		value: string
	}[]
	readonly?: boolean
}>()

const emit = defineEmits<{
	edit: [],
}>()

const id = useId()
</script>

<template lang="pug">
.kern-summary
	.kern-summary__header
		span.kern-number {{ props.number }}
		h3.kern-title.kern-title--small(
			:id="id"
		) {{ props.title }}
	.kern-summary__body
		dl.kern-description-list
			.kern-description-list-item(
				v-for="(item, idx) of props.items"
				:key="idx"
			)
				dt.kern-description-list-item__key {{ item.key }}
				dd.kern-description-list-item__value {{ item.value }}
		.kern-summary__actions(v-if="!props.readonly")
			a.kern-link(
				:aria-describedby="id"
				@click.prevent="emit('edit')"
			)
				span.kern-icon.kern-icon--edit(aria-hidden="true")
				| Bearbeiten
</template>
