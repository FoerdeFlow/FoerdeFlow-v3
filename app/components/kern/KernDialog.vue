<script setup lang="ts">
import { KernAlert } from '#components'

const id = useId()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')

type AlertProps = InstanceType<typeof KernAlert>['$props']
const alerts: Ref<AlertProps[]> = ref([])

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
		alerts.value = []
		dialog.value.close()
	},
	showAlert(props: AlertProps) {
		alerts.value.push(props)
		if(props.type !== 'danger') {
			setTimeout(() => {
				alerts.value.shift()
			}, 5000)
		}
	},
})

function close() {
	if(!dialog.value) return
	alerts.value = []
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
			v-for="(alert, idx) of alerts"
			:key="idx"
			:type="alert.type"
			:title="alert.title"
			:text="alert.text"
			@close="alerts.splice(idx, 1)"
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
