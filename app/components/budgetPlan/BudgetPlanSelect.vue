<script setup lang="ts">
import type { DestructureArray } from '#shared/types'

const props = defineProps<{
	id: string
	budget: string
	/** Whether budget plans that are still being applied for may be picked. */
	pending?: boolean
	readonly?: boolean
}>()

const { data } = useFetch('/api/budgetPlans', {
	query: computed(() => ({
		budget: props.budget,
	})),
})

// Only loaded where they may be picked at all, so that the plain selects do not
// ask for applications they never offer.
const { data: pendingPlans, execute: loadPendingPlans } = useFetch('/api/pendingBudgetPlans', {
	query: computed(() => ({
		budget: props.budget,
	})),
	immediate: false,
	watch: false,
})

watch(() => props.budget, async () => {
	if(!props.pending) return
	await loadPendingPlans()
}, { immediate: true })

/** An approved budget plan or one that is still being applied for. */
type BudgetPlanOption =
	| DestructureArray<typeof data.value>
	| DestructureArray<typeof pendingPlans.value>

const options = computed<BudgetPlanOption[]>(() => [
	...data.value ?? [],
	...props.pending ? pendingPlans.value ?? [] : [],
])

const model = defineModel<BudgetPlanOption | null>({
	required: true,
})

const selectModel = computed({
	get: () => model.value?.id ?? '',
	set: (v) => {
		if(v === '') {
			model.value = null
			return
		}
		model.value = options.value.find(({ id }) => id === v) ?? null
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
			v-for="item of data"
			:key="item.id"
			:value="item.id"
		) {{ formatDate(item.startDate, 'compact') }} - {{ formatDate(item.endDate, 'compact') }}
		optgroup(
			v-if="props.pending && pendingPlans?.length"
			label="Beantragte Haushaltspläne"
		)
			option(
				v-for="item of pendingPlans"
				:key="item.id"
				:value="item.id"
			) {{ formatDate(item.startDate, 'compact') }} - {{ formatDate(item.endDate, 'compact') }}
</template>
