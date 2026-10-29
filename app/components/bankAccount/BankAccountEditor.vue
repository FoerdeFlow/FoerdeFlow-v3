<script setup lang="ts">
import { FetchError } from 'ofetch'

import { KernDialog } from '#components'

const props = defineProps<{
	organizationItem: string
}>()

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	name: string
	iban: string | null
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => JSON.stringify(itemModel.value) !== JSON.stringify(model.value))

function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = structuredClone(data)
	model.value = structuredClone(data)
	dialog.value.show()
}

defineExpose({
	create() {
		openDialog(null, {
			name: '',
			iban: null,
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/bankAccounts/${id}`)
		openDialog(id, {
			name: item.name,
			iban: item.iban,
		})
	},
})

const emit = defineEmits<{
	refresh: []
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

const valid = computed(() => Boolean(model.value?.name.trim()) && isValidIban(model.value?.iban ?? null))

async function save() {
	if(!dialog.value || !model.value) return
	try {
		const body = {
			name: model.value.name,
			iban: model.value.iban,
		}
		if(itemId.value) {
			await $fetch(`/api/bankAccounts/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/bankAccounts', {
				method: 'POST',
				body: {
					...body,
					organizationItem: props.organizationItem,
				},
			})
		}
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: itemId.value
					? t('bankAccount.edit.error.title')
					: t('bankAccount.create.error.title'),
				text: e.data?.message ?? (itemId.value
					? t('bankAccount.edit.error.message')
					: t('bankAccount.create.error.message')
				),
			})
		}
	}
}

const nameId = useId()
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('bankAccount.edit.title') : $t('bankAccount.create.title')"
	:modal="modified"
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		.kern-form-input
			label.kern-label(:for="nameId") {{ $t('bankAccount.input.name.label') }}
			input.kern-form-input__input(
				:id="nameId"
				v-model="model.name"
				type="text"
				maxlength="256"
			)
		KernIbanInput(
			v-model="model.iban"
			:label="$t('bankAccount.input.iban.label')"
		)
</template>
