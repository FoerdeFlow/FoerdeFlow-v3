<script setup lang="ts">
import { FetchError } from 'ofetch'

import { KernDialog } from '#components'

const props = defineProps<{
	organizationItem: string
	// Ein Ort für das Online-Feld taugt nur mit einem Link zur Konferenz.
	online?: boolean
}>()

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

interface Model {
	name: string
	postalAddress: string
	url: string
}
const model = ref<Model | null>(null)

defineExpose({
	create() {
		if(!dialog.value) return
		model.value = {
			name: '',
			postalAddress: '',
			url: '',
		}
		dialog.value.show()
	},
})

const emit = defineEmits<{
	created: [ string ]
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

const valid = computed(() =>
	Boolean(model.value?.name) && (!props.online || Boolean(model.value?.url)))

async function save() {
	if(!dialog.value || !model.value) return
	try {
		const { id } = await $fetch('/api/locations', {
			method: 'POST',
			body: {
				type: 'adHoc',
				organizationItem: props.organizationItem,
				name: model.value.name,
				postalAddress: model.value.postalAddress,
				url: model.value.url,
			},
		})
		dialog.value.hide()
		emit('created', id)
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: t('location.adHoc.error.title'),
				text: e.data?.message ?? t('location.adHoc.error.message'),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="$t('location.adHoc.title')"
	:modal="valid"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		p.kern-body {{ $t('location.adHoc.hint') }}
		LocationNameInput(v-model="model.name")
		LocationPostalAddressInput(v-model="model.postalAddress")
		LocationUrlInput(v-model="model.url")
</template>
