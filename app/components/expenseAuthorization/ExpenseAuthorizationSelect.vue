<script setup lang="ts">
import type { DestructureArray } from '#shared/types'

const props = defineProps<{
	id: string
	/** The plan whose authorizations may be picked, for a planned expense. */
	budgetPlan?: string | null
	/** The budget whose authorizations may be picked, for a reserve payout. */
	budget?: string | null
	readonly?: boolean
}>()

// The API takes exactly one of the two filters, so it is only asked once one of
// them is known.
const { data } = useFetch('/api/expenseAuthorizations', {
	query: computed(() => props.budgetPlan
		? { budgetPlan: props.budgetPlan }
		: { budget: props.budget }),
	immediate: Boolean(props.budgetPlan ?? props.budget),
	default: () => [],
})

const model = defineModel<DestructureArray<typeof data.value> | null>({
	required: true,
})

const selectModel = computed({
	get: () => model.value?.id ?? '',
	set: (v) => {
		if(v === '') {
			model.value = null
			return
		}
		model.value = data.value.find(({ id }) => id === v) ?? null
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
		) - Keine -
		option(
			v-for="item of data"
			:key="item.id"
			:value="item.id"
		) {{ item.title }} ({{ formatCurrency(item.amount) }})
</template>
