<script setup lang="ts">
import type { LongtermContractItemType } from '~/types'

const id = useId()
const model = defineModel<LongtermContractItemType>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") {{ $t('longtermContractItem.input.type.label') }}
	LongtermContractItemTypeSelect(
		:id="id"
		v-model="model"
	)
</template>
