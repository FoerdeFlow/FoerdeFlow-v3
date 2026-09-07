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
	readonly?: boolean
}>()

const { data, execute } = useFetch(() => `/api/budgetPlans/${props.budgetPlan}`, {
	immediate: false,
	watch: false,
})

watch(() => [ props.budgetPlan, props.pendingPlan ], async () => {
	if(props.pendingPlan) return
	await execute()
}, { immediate: true })

const items = computed(() => {
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
			v-for="item of items"
			:key="item.id"
			:value="item.id"
		)
			template(v-if="item.ord")
				| {{ item.ord }} -
			|
			| {{ item.title }}
</template>
