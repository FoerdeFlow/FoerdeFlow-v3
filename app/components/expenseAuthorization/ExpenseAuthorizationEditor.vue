<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'
import type { BudgetPlanItem, ExpenseAuthorizationItemInput } from '~/types'

const props = defineProps<{
	budgetPlan: string
	readonly?: boolean
}>()

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	budgetPlanItem: BudgetPlanItem
	title: string
	description: string | null
	amount: number
	items: ExpenseAuthorizationItemInput[]
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

watch(() => model.value?.items, (items) => {
	if(!items || !model.value) return
	model.value.amount = items.reduce((sum, item) => sum + item.amount, 0)
}, { deep: true })

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
			budgetPlanItem: null,
			title: '',
			description: null,
			amount: 0,
			items: [],
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/expenseAuthorizations/${id}`)
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
			budgetPlanItem: model.value.budgetPlanItem?.id ?? null,
			title: model.value.title,
			description: model.value.description,
			amount: model.value.amount,
			items: model.value.items,
		}
		if(itemId.value) {
			await $fetch(`/api/expenseAuthorizations/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/expenseAuthorizations', {
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
				title: itemId.value
					? t('expenseAuthorization.edit.error.title')
					: t('expenseAuthorization.create.error.title'),
				text: e.data?.message ?? (itemId.value
					? t('expenseAuthorization.edit.error.message')
					: t('expenseAuthorization.create.error.message')
				),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('expenseAuthorization.edit.title') : $t('expenseAuthorization.create.title')"
	:modal="modified"
	:readonly="props.readonly"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		ExpenseAuthorizationBudgetPlanItemInput(
			v-model="model.budgetPlanItem"
			:budget-plan="props.budgetPlan"
			:readonly="props.readonly"
		)
		ExpenseAuthorizationTitleInput(
			v-model="model.title"
			:readonly="props.readonly"
		)
		ExpenseAuthorizationDescriptionInput(
			v-model="model.description"
			:readonly="props.readonly"
		)
		ExpenseAuthorizationAmountInput(
			v-model="model.amount"
			:readonly="true"
		)
		ExpenseAuthorizationItemsInput(v-model="model.items")
</template>
