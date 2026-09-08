<script setup lang="ts">
import type { PaymentOrderType } from '~/types'

const id = useId()

const props = defineProps<{
	readonly?: boolean
}>()

const model = defineModel<PaymentOrderType>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") {{ $t('paymentOrder.input.type.label') }}
	div.kern-hint(
		:id="`${id}-hint`"
	) {{ $t('paymentOrder.input.type.hint') }}
	PaymentOrderTypeSelect(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
		:aria-describedby="`${id}-hint`"
	)
</template>
