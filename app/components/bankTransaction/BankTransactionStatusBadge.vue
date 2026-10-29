<script setup lang="ts">
const props = defineProps<{
	status: BankTransactionStatus
}>()
</script>

<template lang="pug">
template(v-if="props.status === 'assigned'")
	span.kern-badge.kern-badge--success
		span.kern-icon.kern-icon--success(aria-hidden="true")
		span.kern-label.kern-label--small {{ $t('bankTransaction.status.assigned') }}
template(v-else-if="props.status === 'partial'")
	span.kern-badge.kern-badge--info
		span.kern-icon.kern-icon--info(aria-hidden="true")
		span.kern-label.kern-label--small {{ $t('bankTransaction.status.partial') }}
template(v-else)
	span.kern-badge.kern-badge--warning
		span.kern-icon.kern-icon--warning(aria-hidden="true")
		span.kern-label.kern-label--small {{ $t('bankTransaction.status.unassigned') }}
</template>
