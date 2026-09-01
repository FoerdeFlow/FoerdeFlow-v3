<script setup lang="ts">
import type { RepresentationAllowancePeriodUnit } from '~/types'

const id = useId()

const props = defineProps<{
	periodUnit: RepresentationAllowancePeriodUnit
	readonly?: boolean
}>()

const model = defineModel<Date | null>({
	required: true,
})

const { t } = useI18n()

const label = computed(() => props.periodUnit === 'once'
	? t('representationAllowance.input.startDate.labelOnce')
	: t('representationAllowance.input.startDate.label'))
</script>

<template lang="pug">
fieldset.kern-fieldset
	legend.kern-label {{ label }}
	KernDateInput(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
		:show-time="false"
	)
</template>
