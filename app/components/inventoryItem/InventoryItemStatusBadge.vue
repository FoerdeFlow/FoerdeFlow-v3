<script setup lang="ts">
const props = defineProps<{
	status: 'available' | 'lent' | 'overdue'
}>()
</script>

<template lang="pug">
template(v-if="props.status === 'available'")
	span.kern-badge.kern-badge--success
		span.kern-icon.kern-icon--success(aria-hidden="true")
		span.kern-label.kern-label--small {{ $t('inventoryItem.status.available') }}
template(v-else-if="props.status === 'lent'")
	span.kern-badge.kern-badge--info
		span.kern-icon.kern-icon--info(aria-hidden="true")
		span.kern-label.kern-label--small {{ $t('inventoryItem.status.lent') }}
template(v-else)
	span.kern-badge.kern-badge--danger
		span.kern-icon.kern-icon--danger(aria-hidden="true")
		span.kern-label.kern-label--small {{ $t('inventoryItem.status.overdue') }}
</template>
