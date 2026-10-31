<script setup lang="ts">
import type { TravelPermitBudgetPlanItem } from '~/types'

const id = useId()

const props = defineProps<{
	role: string | null
	specialAllocation: string | null
	/** The first day of the journey, the plan in force then is offered. */
	startDate: string | null
	readonly?: boolean
}>()

const model = defineModel<TravelPermitBudgetPlanItem>({
	required: true,
})

const query = computed(() => ({
	role: props.role ?? undefined,
	specialAllocation: props.specialAllocation ?? undefined,
	startDate: props.startDate ?? undefined,
}))

const { data } = useFetch('/api/travelPermits/budgetPlanItems', {
	query,
	immediate: !!props.role && !!props.startDate,
	watch: [ query ],
	default: () => [],
})

const plan = computed(() => data.value[0]?.plan ?? model.value?.plan ?? null)

const selectModel = computed({
	get: () => model.value?.id ?? '',
	set: (v) => {
		model.value = data.value.find((item) => item.id === v) ?? null
	},
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Haushaltstitel
	.kern-hint(
		v-if="plan"
		:id="`${id}-hint`"
	) {{ formatBudget(plan.budget) }}, Haushaltsperiode {{ formatBudgetPlan(plan) }}
	.kern-hint(
		v-else-if="!props.readonly"
		:id="`${id}-hint`"
	) Für den Haushalt der Rolle oder der Sonderzuweisung gilt zu Reisebeginn kein Haushaltsplan.
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="id"
			v-model="selectModel"
			:disabled="props.readonly"
			:aria-describedby="`${id}-hint`"
		)
			option(value="") - Bitte wählen -
			option(
				v-if="model && !data.some((item) => item.id === model?.id)"
				:value="model.id"
			) {{ formatBudgetPlanItem(model) }}
			option(
				v-for="item of data"
				:key="item.id"
				:value="item.id"
			) {{ formatBudgetPlanItem(item) }}
</template>
