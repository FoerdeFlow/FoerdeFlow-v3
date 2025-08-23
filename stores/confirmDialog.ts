import { defineStore } from 'pinia'

export const useConfirmDialogStore = defineStore('confirmDialog', () => {
	const visible = ref(false)
	const title = ref('')
	const text = ref('')
	const abortLabel = ref('')
	const confirmLabel = ref('')

	const onAbort = ref<(() => void) | null>(null)
	const onConfirm = ref<(() => void) | null>(null)

	async function askConfirm(props: { title: string, text: string, abortLabel?: string, confirmLabel?: string }) {
		title.value = props.title
		text.value = props.text
		abortLabel.value = props.abortLabel ?? 'Nein, abbrechen'
		confirmLabel.value = props.confirmLabel ?? 'Ja, bestätigen'
		visible.value = true

		return await new Promise((resolve) => {
			onConfirm.value = () => {
				visible.value = false
				resolve(true)
			}
			onAbort.value = () => {
				visible.value = false
				resolve(false)
			}
		})
	}

	return {
		visible,
		title,
		text,
		abortLabel,
		confirmLabel,

		askConfirm,
		onAbort,
		onConfirm,
	}
})
