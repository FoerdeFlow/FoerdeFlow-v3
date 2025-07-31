<script setup lang="ts">
const authStore = useAuthStore()
await authStore.initialize()
</script>

<template lang="pug">
NuxtLayout
	NuxtPage
</template>

<style lang="scss">
body {
	margin: 0;
	padding: 0;
}
</style>