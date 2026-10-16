<script setup lang="ts">
const props = defineProps<{
	membership: {
		startDate: string | Date | null
		endDate: string | Date | null
	}
}>()

const status = computed(() => getMembershipStatus(props.membership))
</script>

<template lang="pug">
.ff3-membership-status(v-if="status !== 'active'")
	span.kern-badge.kern-badge--info(v-if="status === 'future'")
		span.kern-label.kern-label--small Künftig
	span.kern-badge.ff3-membership-status__ended(v-else)
		span.kern-label.kern-label--small Beendet
</template>

<style scoped>
.ff3-membership-status {
	margin-bottom: var(--kern-metric-space-x-small);
}

/* KERN kennt keine neutrale Plakette; ohne Rahmen stünde nur das Wort da. */
.ff3-membership-status__ended {
	border: var(--kern-metric-border-width-default) solid var(--kern-color-layout-border);
}
</style>
