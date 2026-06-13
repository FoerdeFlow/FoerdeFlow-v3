<script setup lang="ts">
import type { LongtermContractTimeUnit } from '~/types'

const props = defineProps<{
	id: string
}>()

const timeUnits: LongtermContractTimeUnit[] = [ 'month', 'quarter', 'semester', 'year' ]

const model = defineModel<LongtermContractTimeUnit | null>({
	required: true,
})

const selectModel = computed({
	get: () => model.value ?? '',
	set: (v) => {
		model.value = v === '' ? null : v
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
			disabled
			value=""
		) - Bitte wählen -
		option(
			v-for="item of timeUnits"
			:key="item"
			:value="item"
		) {{ $t(`longtermContractItem.timeUnit.${item}`) }}
</template>
