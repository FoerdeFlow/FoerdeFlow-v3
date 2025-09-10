<script setup lang="ts">
const id = useId()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')

const props = defineProps<{
	title: string
	text: string
	abortLabel?: string
	confirmLabel?: string
}>()

const emit = defineEmits<{
	abort: [],
	confirm: [],
}>()

onMounted(() => {
	if(!dialog.value) return
	dialog.value.showModal()
})
</script>

<template lang="pug">
dialog.kern-dialog(
	:id="`${id}`"
	ref="dialog"
	:class="$style.dialog"
	closedby="none"
	:aria-labelledby="`${id}-heading`"
)
	header.kern-dialog__header
		h2.kern-title.kern-title--large(:id="`${id}-heading`") {{ props.title }}
	section.kern-dialog__body
		p.kern-text {{ props.text }}
	footer.kern-dialog__footer
		button.kern-btn.kern-btn--secondary(@click="emit('abort')")
			span.kern-icon.kern-icon--close(aria-hidden="true")
			span.kern-label {{ props.abortLabel }}
		button.kern-btn.kern-btn--primary(@click="emit('confirm')")
			span.kern-icon.kern-icon--check(aria-hidden="true")
			span.kern-label {{ props.confirmLabel }}
</template>

<style module>
.dialog {
	width: 100%;
}

@media (min-width: 35rem) {
	.dialog {
		width: 35rem;
	}
}
</style>
