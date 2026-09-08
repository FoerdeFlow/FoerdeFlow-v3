<script setup lang="ts">
import type { PaymentOrderRecipientType } from '~/types'

const props = defineProps<{
	id: string
	readonly?: boolean
}>()

const recipientTypes: PaymentOrderRecipientType[] = [ 'reimbursement', 'invoice' ]

const model = defineModel<PaymentOrderRecipientType>({
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
			v-for="item of recipientTypes"
			:key="item"
			:value="item"
		) {{ $t(`paymentOrder.recipientType.${item}`) }}
</template>
