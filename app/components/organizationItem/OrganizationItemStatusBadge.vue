<script setup lang="ts">
const props = defineProps<{
	/** The day the unit is dissolved from, as `YYYY-MM-DD`. */
	dissolvedAt: string | null
	/** Whether the unit or one above it is dissolved. */
	inactive: boolean
}>()

/*
 * Inaktiv kann eine Einheit durch ihr eigenes Datum oder durch eine aufgelöste
 * übergeordnete Einheit sein; ein eigenes Datum in der Zukunft kündigt die
 * Auflösung nur an.
 */
const ownDateReached = computed(() =>
	props.dissolvedAt !== null && props.dissolvedAt <= (serializeDate(new Date()) ?? ''))
</script>

<template lang="pug">
span.kern-badge.kern-badge--warning(v-if="props.inactive && ownDateReached")
	span.kern-label.kern-label--small Aufgelöst seit {{ formatDate(props.dissolvedAt, 'compact') }}
span.kern-badge.kern-badge--warning(v-else-if="props.inactive")
	span.kern-label.kern-label--small Inaktiv, übergeordnete Einheit aufgelöst
span.kern-badge.kern-badge--info(v-else-if="props.dissolvedAt")
	span.kern-label.kern-label--small Aufgelöst ab {{ formatDate(props.dissolvedAt, 'compact') }}
</template>
