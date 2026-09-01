<script setup lang="ts">
import type { RepresentationAllowancePeriodUnit } from '~/types'

const props = defineProps<{
	id: string
	readonly?: boolean
}>()

const periodUnits: RepresentationAllowancePeriodUnit[] = [ 'month', 'once' ]

const model = defineModel<RepresentationAllowancePeriodUnit>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input__select-wrapper
	select.kern-form-input__select(
		:id="props.id"
		v-model="model"
		:disabled="props.readonly"
	)
		option(
			v-for="item of periodUnits"
			:key="item"
			:value="item"
		) {{ $t(`representationAllowance.periodUnit.${item}`) }}
</template>
