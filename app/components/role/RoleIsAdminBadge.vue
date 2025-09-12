<script setup lang="ts">
const props = defineProps<{
	isAdmin: boolean
}>()
</script>

<template lang="pug">
template(v-if="props.isAdmin")
	span.kern-badge.kern-badge--info
		span.kern-icon.kern-icon--info(aria-hidden="true")
		span.kern-label.kern-label--small Administrator
</template>
