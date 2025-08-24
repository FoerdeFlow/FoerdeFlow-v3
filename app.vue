<script setup lang="ts">
import type { KernConfirmDialog } from '#components'

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
	:abort-label="confirmDialogStore.abortLabel"
	:confirm-label="confirmDialogStore.confirmLabel"
	@abort="() => confirmDialogStore.onAbort?.()"
	@confirm="() => confirmDialogStore.onConfirm?.()"
)
</template>

<style>
body {
	margin: 0;
	padding: 0;
}
</style>
