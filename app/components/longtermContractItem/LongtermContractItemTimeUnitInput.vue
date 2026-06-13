<script setup lang="ts">
import type { LongtermContractTimeUnit } from '~/types'

const id = useId()
const model = defineModel<LongtermContractTimeUnit | null>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") {{ $t('longtermContractItem.input.timeUnit.label') }}
	LongtermContractItemTimeUnitSelect(
		:id="id"
		v-model="model"
	)
</template>
