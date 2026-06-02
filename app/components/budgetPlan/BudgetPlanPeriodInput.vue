<script setup lang="ts">
import type { BudgetPeriodType } from '~/types'

const id = useId()

const props = defineProps<{
	periodType: NonNullable<BudgetPeriodType>
	readonly?: boolean
}>()

const startDate = defineModel<Date | null>('startDate', {
	required: true,
})
const endDate = defineModel<Date | null>('endDate', {
	required: true,
})

function getSemester(id: string) {
	const year = parseInt(id.substring(0, 4))
	const type = parseInt(id.substring(4))
	const label = `${type === 1 ? 'Sommersemester' : 'Wintersemester'} ${year}${type === 2 ? `/${year + 1}` : ''}`
	const startDate = type === 1 ? new Date(year, 2, 1) : new Date(year, 8, 1)
	const endDate = type === 1 ? new Date(year, 7, 31) : new Date(year + 1, 1, 28)
	return { id, label, startDate, endDate }
}
function getCalendarYear(id: string) {
	const year = parseInt(id)
	const label = `${year}`
	const startDate = new Date(year, 0, 1)
	const endDate = new Date(year, 11, 31)
	return { id, label, startDate, endDate }
}

const referenceYear = new Date().getFullYear()
const options = props.periodType === 'semester'
	? Array(7).fill(0).map((_, i) =>
		getSemester(`${referenceYear + Math.floor(i / 2) - 1}${i % 2 === 0 ? '1' : '2'}`),
	)
	: Array(5).fill(0).map((_, i) =>
		getCalendarYear(`${referenceYear + i - 2}`),
	)

const selectModel = computed({
	get: () =>
		options.find(
			(option) =>
				option.startDate.getTime() === startDate.value?.getTime() &&
				option.endDate.getTime() === endDate.value?.getTime(),
		)?.id ?? '',
	set: (value: string) => {
		const option = options.find((option) => option.id === value)
		if(option) {
			startDate.value = option.startDate
			endDate.value = option.endDate
		} else {
			startDate.value = null
			endDate.value = null
		}
	},
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") Haushaltsperiode
	.kern-form-input__select-wrapper
		select.kern-form-input__select(
			:id="id"
			v-model="selectModel"
		)
			option(
				disabled
				value=""
			) - Bitte wählen -
			option(
				v-for="item of options"
				:key="item.id"
				:value="item.id"
			) {{ item.label }}
</template>
