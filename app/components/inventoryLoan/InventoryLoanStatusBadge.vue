<script setup lang="ts">
const props = defineProps<{
	status: 'open' | 'overdue' | 'returned'
}>()
</script>

<template lang="pug">
template(v-if="props.status === 'open'")
	span.kern-badge.kern-badge--info
		span.kern-icon.kern-icon--info(aria-hidden="true")
		span.kern-label.kern-label--small {{ $t('inventoryLoan.status.open') }}
template(v-else-if="props.status === 'overdue'")
	span.kern-badge.kern-badge--danger
		span.kern-icon.kern-icon--danger(aria-hidden="true")
		span.kern-label.kern-label--small {{ $t('inventoryLoan.status.overdue') }}
template(v-else)
	span.kern-badge.kern-badge--success
		span.kern-icon.kern-icon--success(aria-hidden="true")
		span.kern-label.kern-label--small {{ $t('inventoryLoan.status.returned') }}
</template>
