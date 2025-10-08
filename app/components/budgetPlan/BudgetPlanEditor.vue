<script setup lang="ts">
import { FetchError } from 'ofetch'
import { KernDialog } from '#components'
import type { BudgetPlanItem } from '~/types'

const props = defineProps<{
	budget: string
	readonly?: boolean
}>()

const { t } = useI18n()

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	startDate: Date | null
	endDate: Date | null
	items: BudgetPlanItem[]
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
			startDate: null,
			endDate: null,
			items: [],
		})
	},
	async edit(id: string) {
		const item = await $fetch(`/api/budgetPlans/${id}`)
		openDialog(id, {
			startDate: item.startDate ? new Date(item.startDate) : null,
			endDate: item.endDate ? new Date(item.endDate) : null,
			items: item.items,
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

async function save() {
	if(!dialog.value || !model.value) return
	try {
		const body = {
			budget: props.budget,
			startDate: serializeDate(model.value.startDate),
			endDate: serializeDate(model.value.endDate),
			items: model.value.items,
		}
		if(itemId.value) {
			await $fetch(`/api/budgetPlans/${itemId.value}`, {
				method: 'PUT',
				body,
			})
		} else {
			await $fetch('/api/budgetPlans', {
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
					? t('budgetPlan.edit.error.title')
					: t('budgetPlan.create.error.title'),
				text: e.data?.message ?? (itemId.value
					? t('budgetPlan.edit.error.message')
					: t('budgetPlan.create.error.message')
				),
			})
		}
	}
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('budgetPlan.edit.title') : $t('budgetPlan.create.title')"
	:modal="modified"
	:readonly="props.readonly"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		.kern-fieldset__body.kern-fieldset__body--horizontal
			BudgetPlanStartDateInput.flex-1(
				v-model="model.startDate"
				:readonly="props.readonly"
			)
			BudgetPlanEndDateInput.flex-1(
				v-model="model.endDate"
				:readonly="props.readonly"
			)
		BudgetPlanItemsInput(v-model="model.items")
</template>
