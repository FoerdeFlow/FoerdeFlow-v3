<script setup lang="ts">
const props = defineProps<{
	status: 'present' | 'absent' | 'excused' | 'late' | null
}>()
</script>

<template lang="pug">
template(v-if="props.status === 'present'")
	span.kern-badge.kern-badge--success
		span.kern-icon.kern-icon--success(aria-hidden="true")
		span.kern-label.kern-label--small Anwesend
template(v-else-if="props.status === 'absent'")
	span.kern-badge.kern-badge--danger
		span.kern-icon.kern-icon--danger(aria-hidden="true")
		span.kern-label.kern-label--small Abwesend
template(v-else-if="props.status === 'excused'")
	span.kern-badge.kern-badge--warning
		span.kern-icon.kern-icon--warning(aria-hidden="true")
		span.kern-label.kern-label--small Entschuldigt
template(v-else-if="props.status === 'late'")
	span.kern-badge.kern-badge--warning
		span.kern-icon.kern-icon--warning(aria-hidden="true")
		span.kern-label.kern-label--small Verspätet
template(v-else)
	span.kern-badge.kern-badge--info
		span.kern-icon.kern-icon--info(aria-hidden="true")
		span.kern-label.kern-label--small Unbekannt
</template>
