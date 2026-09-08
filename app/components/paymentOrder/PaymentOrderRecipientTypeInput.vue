<script setup lang="ts">
import type { PaymentOrderRecipientType } from '~/types'

const id = useId()

const props = defineProps<{
	readonly?: boolean
}>()

const model = defineModel<PaymentOrderRecipientType>({
	required: true,
})
</script>

<template lang="pug">
.kern-form-input
	label.kern-label(:for="id") {{ $t('paymentOrder.input.recipientType.label') }}
	div.kern-hint(
		:id="`${id}-hint`"
	) {{ $t('paymentOrder.input.recipientType.hint') }}
	PaymentOrderRecipientTypeSelect(
		:id="id"
		v-model="model"
		:readonly="props.readonly"
		:aria-describedby="`${id}-hint`"
	)
</template>
