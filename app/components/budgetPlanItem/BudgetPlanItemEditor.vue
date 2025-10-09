<script setup lang="ts">
import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const itemId = ref<string | null>(null)

interface Model {
	ord: number | null
	title: string
	description: string | null
	revenues: number
	expenses: number
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
			ord: null,
			title: '',
			description: null,
			revenues: 0,
			expenses: 0,
		})
	},
	edit({ id, ...item }: { id: string } & Model) {
		openDialog(id, item)
	},
})

const emit = defineEmits<{
	save: [string | null, Model]
}>()

function cancel() {
	if(!dialog.value) return
	dialog.value.hide()
}

function save() {
	if(!dialog.value || !model.value) return
	dialog.value.hide()
	emit('save', itemId.value, model.value)
}
</script>

<template lang="pug">
KernDialog(
	ref="dialog"
	:title="itemId ? $t('budgetPlanItem.edit.title') : $t('budgetPlanItem.create.title')"
	:modal="modified"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		.kern-fieldset__body.kern-fieldset__body--horizontal
			BudgetPlanItemOrdInput(
				v-model="model.ord"
			)
			BudgetPlanItemTitleInput.flex-1(
				v-model="model.title"
			)
		.kern-fieldset__body.kern-fieldset__body--horizontal
			BudgetPlanItemRevenuesInput.flex-1(
				v-model="model.revenues"
			)
			BudgetPlanItemExpensesInput.flex-1(
				v-model="model.expenses"
			)
		BudgetPlanItemDescriptionInput(
			v-model="model.description"
		)
</template>
