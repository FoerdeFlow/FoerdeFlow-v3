<script setup lang="ts">
import type { KernConfirmDialog } from '#components'

const authStore = useAuthStore()
await authStore.initialize()

const confirmDialogStore = useConfirmDialogStore()
const confirmDialog = useTemplateRef<typeof KernConfirmDialog>('confirmDialog')
</script>

<template lang="pug">
NuxtLayout
	NuxtPage

KernConfirmDialog(
	v-if="confirmDialogStore.visible"
	ref="confirmDialog"
	:title="confirmDialogStore.title"
	:text="confirmDialogStore.text"
	:abortLabel="confirmDialogStore.abortLabel"
	:confirmLabel="confirmDialogStore.confirmLabel"
	@abort="() => confirmDialogStore.onAbort?.()"
	@confirm="() => confirmDialogStore.onConfirm?.()"
)
</template>

<style lang="scss">
body {
	margin: 0;
	padding: 0;
}
</style>