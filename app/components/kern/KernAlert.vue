<script setup lang="ts">
const props = defineProps<{
	type: 'danger'
	title: string
	text: string
}>()

const emit = defineEmits<{
	close: [],
}>()
</script>

<template lang="pug">
.kern-alert.my-4(
	:class="`kern-alert--${props.type}`"
	role="alert"
)
	.kern-alert__header
		span.kern-icon(
			:class="`kern-icon--${props.type}`"
			aria-hidden="true"
		)
		span.kern-title {{ props.title }}
		.flex-1(aria-hidden="true")
		button.kern-btn.kern-btn--tertiary(@click="emit('close')")
			span.kern-icon.kern-icon--close(aria-hidden="true")
			span.kern-sr-only Schließen
	.kern-alert__body
		p.kern-body {{ props.text }}
</template>
