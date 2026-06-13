<script setup lang="ts">
import type { LongtermContractItemType } from '~/types'

const props = defineProps<{
	id: string
}>()

const types: LongtermContractItemType[] = [ 'time', 'usage', 'fixed' ]

const model = defineModel<LongtermContractItemType>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input__select-wrapper
	select.kern-form-input__select(
		:id="props.id"
		v-model="model"
	)
		option(
			v-for="item of types"
			:key="item"
			:value="item"
		) {{ $t(`longtermContractItem.type.${item}`) }}
</template>
