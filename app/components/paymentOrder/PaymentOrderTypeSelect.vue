<script setup lang="ts">
import type { PaymentOrderType } from '~/types'

const props = defineProps<{
	id: string
	readonly?: boolean
}>()

const types: PaymentOrderType[] = [ 'planned', 'reserve' ]

const model = defineModel<PaymentOrderType>({
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
			v-for="item of types"
			:key="item"
			:value="item"
		) {{ $t(`paymentOrder.type.${item}`) }}
</template>
