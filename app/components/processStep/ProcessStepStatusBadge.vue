<script setup lang="ts">
const props = defineProps<{
	status: 'pending' | 'completed' | 'failed' | null
}>()
</script>

<template lang="pug">
template(v-if="props.status === 'pending'")
	span.kern-badge.kern-badge--info
		span.kern-icon.kern-icon--info(aria-hidden="true")
		span.kern-label.kern-label--small Offen
template(v-else-if="props.status === 'completed'")
	span.kern-badge.kern-badge--success
		span.kern-icon.kern-icon--success(aria-hidden="true")
		span.kern-label.kern-label--small Abgeschlossen
template(v-else-if="props.status === 'failed'")
	span.kern-badge.kern-badge--danger
		span.kern-icon.kern-icon--danger(aria-hidden="true")
		span.kern-label.kern-label--small Fehlgeschlagen
</template>
