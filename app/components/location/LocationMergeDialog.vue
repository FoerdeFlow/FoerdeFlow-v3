<script setup lang="ts">
import { FetchError } from 'ofetch'

import type { Location } from '~/types'

import { KernDialog } from '#components'

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const sourceId = ref<string | null>(null)
const sourceLabel = ref('')
const usage = ref({ events: 0, sessions: 0, children: 0 })
const target = ref<Location>(null)

defineExpose({
	async merge(id: string) {
		if(!dialog.value) return
		const item = await $fetch(`/api/locations/${id}`)
		sourceId.value = id
		sourceLabel.value = formatLocation(item)
		usage.value = item.usage
		target.value = null
		dialog.value.show()
	},
})

const emit = defineEmits<{
	refresh: []
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

const valid = computed(() => Boolean(target.value) && target.value?.id !== sourceId.value)

async function save() {
	if(!dialog.value || !sourceId.value || !target.value) return
	try {
		await $fetch(`/api/locations/${sourceId.value}/merge`, {
			method: 'POST',
			body: { target: target.value.id },
		})
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: t('location.merge.error.title'),
				text: e.data?.message ?? t('location.merge.error.message'),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="$t('location.merge.title')"
	:modal="valid"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	p.kern-body {{ $t('location.merge.text', { location: sourceLabel }) }}
	p.kern-body {{ $t('location.merge.usage', usage) }}
	.kern-form-input
		label.kern-label(for="location-merge-target") {{ $t('location.merge.target.label') }}
		LocationSelect(
			id="location-merge-target"
			v-model="target"
		)
</template>
