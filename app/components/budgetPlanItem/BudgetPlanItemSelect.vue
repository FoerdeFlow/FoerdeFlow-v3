<script setup lang="ts">
import type { DestructureArray } from '#shared/types'
import type { PendingBudgetPlan } from '~/types'

const props = defineProps<{
	id: string
	budgetPlan: string
	/**
	 * The plan when it is still being applied for. Such a plan has no rows to
	 * load, it carries its items itself.
	 */
	pendingPlan?: PendingBudgetPlan | null
	/** Whether titles that are still being applied for may be picked. */
	pending?: boolean
	readonly?: boolean
}>()

const { data, execute } = useFetch(() => `/api/budgetPlans/${props.budgetPlan}`, {
	immediate: false,
	watch: false,
})

// Only loaded where they may be picked at all, so that the plain selects do not
// ask for supplements they never offer. A plan that is still being applied for
// carries no supplements either, it has no rows to add them to yet.
const { data: pendingItems, execute: loadPendingItems } = useFetch('/api/pendingBudgetPlanItems', {
	query: computed(() => ({
		plan: props.budgetPlan,
	})),
	immediate: false,
	watch: false,
})

watch(() => [ props.budgetPlan, props.pendingPlan ], async () => {
	if(props.pendingPlan) return
	await execute()
	if(props.pending) await loadPendingItems()
}, { immediate: true })

const planItems = computed(() => {
	const plan = props.pendingPlan
	if(plan) {
		return plan.items.map((item) => ({ plan, ...item }))
	}

	if(!data.value) return []
	const { items, ...planData } = data.value
	return items.map((item) => ({
		plan: {
			...planData,
			id: props.budgetPlan,
		},
		...item,
	}))
})

/** The titles a supplement of this plan is still being applied for. */
const appliedItems = computed(() =>
	props.pending && !props.pendingPlan ? pendingItems.value ?? [] : [])

const items = computed(() => [ ...planItems.value, ...appliedItems.value ])

const model = defineModel<DestructureArray<typeof items.value> | null>({
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
		:disabled="props.readonly"
	)
		option(
			value=""
		) - Bitte wählen -
		option(
			v-for="item of planItems"
			:key="item.id"
			:value="item.id"
		)
			template(v-if="item.ord")
				| {{ item.ord }} -
			|
			| {{ item.title }}
		optgroup(
			v-if="appliedItems.length"
			label="Beantragte Haushaltstitel"
		)
			option(
				v-for="item of appliedItems"
				:key="item.id"
				:value="item.id"
			)
				template(v-if="item.ord")
					| {{ item.ord }} -
				|
				| {{ item.title }}
</template>
