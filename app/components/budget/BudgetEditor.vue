<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'
import type { OrganizationItem } from '~/types'

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	organizationItem: OrganizationItem
	code: string
	name: string
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

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
			organizationItem: null,
			code: '',
			name: '',
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/budgets/${id}`)
		openDialog(id, item)
	},
})

const emit = defineEmits<{
	refresh: []
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

async function save() {
	if(!dialog.value || !model.value) return
	try {
		const body = {
			organizationItem: model.value.organizationItem?.id ?? null,
			code: model.value.code,
			name: model.value.name,
		}
		if(itemId.value) {
			await $fetch(`/api/budgets/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/budgets', {
				method: 'POST',
				body,
			})
		}
		dialog.value.hide()
		emit('refresh')
	} catch(e: unknown) {
		if(e instanceof FetchError) {
			dialog.value.showAlert({
				type: 'danger',
				title: itemId.value ? t('budget.edit.error.title') : t('budget.create.error.title'),
				text: e.data?.message ?? (itemId.value
					? t('budget.edit.error.message')
					: t('budget.create.error.message')
				),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('budget.edit.title') : $t('budget.create.title')"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		BudgetOrganizationItemInput(v-model="model.organizationItem")
		BudgetCodeInput(v-model="model.code")
		BudgetNameInput(v-model="model.name")
</template>
