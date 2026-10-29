<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { KernDialog } from '#components'

const { t } = useI18n()
const alertStore = useAlertStore()

const id = useId()
const file = ref<File | null>(null)
const dialog = useTemplateRef<typeof KernDialog>('dialog')

defineExpose({
	show() {
		if(!dialog.value) return
		file.value = null
		dialog.value.show()
	},
})

const emit = defineEmits<{
	refresh: [],
}>()

function onChange(event: Event) {
	file.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

const valid = computed(() => file.value !== null)

async function save() {
	if(!dialog.value || !file.value) return
	try {
		const result = await $fetch('/api/bankStatements', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/xml',
			},
			body: file.value,
		})
		dialog.value.hide()
		emit('refresh')
		alertStore.showAlert({
			type: 'success',
			title: t('bankStatement.upload.success'),
			text: result.statements
				.map((statement) => t('bankStatement.upload.result', statement))
				.join(' '),
		})
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: t('bankStatement.upload.error.title'),
				text: e.data?.message ?? t('bankStatement.upload.error.message'),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="$t('bankStatement.upload.title')"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	.kern-form-input
		label.kern-label(:for="id") {{ $t('bankStatement.upload.label') }}
		.kern-hint(:id="`${id}-hint`") {{ $t('bankStatement.upload.hint') }}
		input.kern-form-input__input(
			:id="id"
			type="file"
			accept=".xml,application/xml,text/xml"
			:aria-describedby="`${id}-hint`"
			@change="onChange"
		)
</template>
