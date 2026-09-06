<script setup lang="ts">
import type { RepresentationAllowancePeriodUnit } from '~/types'

const props = defineProps<{
	periodUnit: RepresentationAllowancePeriodUnit
}>()

const model = defineModel<number | null>({
	required: true,
})

const { t } = useI18n()

const label = computed(() => props.periodUnit === 'once'
	? t('representationAllowanceRecipient.input.amount.labelOnce')
	: t('representationAllowanceRecipient.input.amount.label'))
</script>

<template lang="pug">
KernCurrencyInput(
	v-model="model"
	:label="label"
)
</template>
