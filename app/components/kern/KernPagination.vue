<script lang="ts" setup>
import { computed, watch } from 'vue'

const props = defineProps<{
	count: number
	pageSize: number
}>()

const startIndex = defineModel<number>({ required: true })
const currentPage = computed({
	get: () => startIndex.value / props.pageSize + 1,
	set: (page) => {
		startIndex.value = (page - 1) * props.pageSize
	},
})

const pageCount = computed(() => Math.ceil(props.count / props.pageSize))

watch([() => props.count, () => props.pageSize], () => {
	if (currentPage.value > pageCount.value) {
		startIndex.value = 0
	}
})

const visibleOptions = computed<({ dots: string } | { page: number })[]>(() => {
	const generatePageInterval = (start: number, end: number) =>
		new Array(end - start + 1).fill(null).map((_, idx) => ({
			page: idx + start,
		}))

	if (pageCount.value <= 7) {
		return generatePageInterval(1, pageCount.value)
	}

	if (currentPage.value < 5) {
		return [
			...generatePageInterval(1, 5),
			{ dots: 'only' },
			...generatePageInterval(pageCount.value, pageCount.value),
		]
	}

	if (currentPage.value > pageCount.value - 4) {
		return [
			...generatePageInterval(1, 1),
			{ dots: 'only' },
			...generatePageInterval(pageCount.value - 4, pageCount.value),
		]
	}

	return [
		...generatePageInterval(1, 1),
		{ dots: 'only' },
		...generatePageInterval(currentPage.value - 1, currentPage.value + 1),
		{ dots: 'only' },
		...generatePageInterval(pageCount.value, pageCount.value),
	]
})
</script>

<template lang="pug">
nav(v-if="pageCount > 1")
	ul
		li
			button(
				class="kern-btn kern-btn--secondary"
				:disabled="currentPage <= 1"
				@click="currentPage--"
			)
				span.kern-icon.kern-icon--arrow-back(aria-hidden="true")
				span.kern-label.kern-sr-only Zurück
		li(v-for="option of visibleOptions" :key="'dots' in option ? option.dots : option.page")
			template(v-if="'dots' in option") …
			button(
				v-else-if="option.page"
				class="kern-btn kern-btn--secondary"
				:class="{ active: currentPage === option.page }"
				:aria-label="`Seite ${option.page}`"
				@click="currentPage = option.page"
			)
				span.kern-label {{ option.page }}
		li
			button(
				class="kern-btn kern-btn--secondary"
				:disabled="currentPage >= pageCount"
				@click="currentPage++"
			)
				span.kern-icon.kern-icon--arrow-forward(aria-hidden="true")
				span.kern-label.kern-sr-only Weiter
</template>

<style scoped>
nav {
	width: 100%;
}

ul {
	display: flex;
	list-style-type: none;
	padding: 0;
	align-items: center;
	justify-content: space-between;
}

.kern-btn.active {
	background-color: var(--kern-color-action-default);
	pointer-events: none;

	.kern-label {
		color: var(--kern-color-action-on-default);
	}
}
</style>