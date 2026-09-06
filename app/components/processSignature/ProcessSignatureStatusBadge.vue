<script setup lang="ts">
const props = defineProps<{
	status: 'pending' | 'received' | null
}>()
</script>

<template lang="pug">
template(v-if="props.status === 'pending'")
	span.kern-badge.kern-badge--info
		span.kern-icon.kern-icon--info(aria-hidden="true")
		span.kern-label.kern-label--small Ausstehend
template(v-else-if="props.status === 'received'")
	span.kern-badge.kern-badge--success
		span.kern-icon.kern-icon--success(aria-hidden="true")
		span.kern-label.kern-label--small Eingegangen
</template>
