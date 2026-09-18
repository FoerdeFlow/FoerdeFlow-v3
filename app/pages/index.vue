<script setup lang="ts">
const authStore = useAuthStore()
</script>

<template lang="pug">
h1.kern-heading-large(v-if="authStore.loggedIn") Willkommen, {{ authStore.displayName }}!
h1.kern-heading-large(v-else) Willkommen bei FördeFlow
HomeTasks(v-if="authStore.loggedIn")
HomeNavigation
</template>

<style scoped>
/*
 * KERN setzt bei `kern-heading-large` `margin: 0` und liegt in der Kaskade
 * hinter den Tailwind-Utilities; `mb-8` bliebe hier also wirkungslos.
 */
h1 {
	margin-bottom: var(--kern-metric-space-x-large);
}
</style>
