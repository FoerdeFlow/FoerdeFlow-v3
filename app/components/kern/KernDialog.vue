<script setup lang="ts">
const id = useId()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')

const { alerts, clearAlerts, dismissAlert, pauseAlert, resumeAlert, showAlert } = useAlerts()

const { title, modal = false, valid = true, readonly = false } = defineProps<{
	title: string
	modal?: boolean
	valid?: boolean
	readonly?: boolean
}>()

const emit = defineEmits<{
	close: [],
	cancel: [],
	save: [],
}>()

defineExpose({
	show() {
		if(!dialog.value) return
		dialog.value.showModal()
	},
	hide() {
		if(!dialog.value) return
		clearAlerts()
		dialog.value.close()
	},
	showAlert,
})

function close() {
	if(!dialog.value) return
	clearAlerts()
	dialog.value.close()
}
</script>

<template lang="pug">
dialog.kern-dialog(
	:id="`${id}`"
	ref="dialog"
	:class="$style.dialog"
	:closedby="modal ? 'none' : 'closerequest'"
	:aria-labelledby="`${id}-heading`"
)
	header.kern-dialog__header
		h2.kern-title.kern-title--large(:id="`${id}-heading`") {{ title }}
		button.kern-btn.kern-btn--tertiary(@click="close()")
			span.kern-icon.kern-icon--close(aria-hidden="true")
			span.kern-sr-only Schließen
	section.kern-dialog__body
		KernAlert(
			v-for="alert of alerts"
			:key="alert.id"
			:type="alert.props.type"
			:title="alert.props.title"
			:text="alert.props.text"
			:items="alert.props.items"
			@close="dismissAlert(alert.id)"
			@pause="pauseAlert(alert.id)"
			@resume="resumeAlert(alert.id)"
		)
		slot
	footer.kern-dialog__footer
		slot(name="actions")
			template(v-if="readonly")
				button.kern-btn.kern-btn--primary(@click="emit('cancel')")
					span.kern-icon.kern-icon--close(aria-hidden="true")
					span.kern-label Schließen
			template(v-else)
				button.kern-btn.kern-btn--secondary(@click="emit('cancel')")
					span.kern-icon.kern-icon--close(aria-hidden="true")
					span.kern-label Abbrechen
				button.kern-btn.kern-btn--primary(
					:disabled="!valid"
					@click="emit('save')"
				)
					span.kern-icon.kern-icon--check(aria-hidden="true")
					span.kern-label Speichern
</template>

<style module>
.dialog {
	width: 100%;
}

@media (min-width: 50rem) {
	.dialog {
		width: 50rem;
	}
}
</style>
