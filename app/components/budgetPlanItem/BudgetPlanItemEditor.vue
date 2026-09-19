<script setup lang="ts">
import { KernDialog } from '#components'

const dialog = useTemplateRef<typeof KernDialog>('dialog')

const props = defineProps<{
	/** The ordinals of the other titles of the plan, which may not be repeated. */
	usedOrds?: number[]
	/** The balance of the other titles of the plan, which this one may even out. */
	otherBalance?: number
}>()

const itemId = ref<string | null>(null)

interface Model {
	ord: number | null
	title: string
	description: string | null
	revenues: number | null
	expenses: number | null
}
const itemModel = ref<Model | null>(null)
const model = ref<Model | null>(null)
const modified = computed(() => {
	if(!itemModel.value || !model.value) return false
	return JSON.stringify(itemModel.value) !== JSON.stringify(model.value)
})

const ordValid = computed(() => {
	const ord = model.value?.ord
	return typeof ord === 'number' && Number.isInteger(ord) && ord >= 1 &&
		!props.usedOrds?.includes(ord)
})

// The amounts which even out the plan, each given the amount entered on the
// other side of this title. Only the side which ends up positive is offered,
// since the remainder belongs on exactly one of them.
const remainingRevenues = computed(() => currencySum(model.value?.expenses, -(props.otherBalance ?? 0)))
const remainingExpenses = computed(() => currencySum(model.value?.revenues, props.otherBalance))

const valid = computed(() => {
	if(!model.value) return false
	return ordValid.value &&
		model.value.title.trim() !== '' &&
		((model.value.revenues ?? 0) !== 0 || (model.value.expenses ?? 0) !== 0)
})

function openDialog(id: string | null, data: Model) {
	if(!dialog.value) return
	itemId.value = id
	itemModel.value = structuredClone(data)
	model.value = structuredClone(data)
	dialog.value.show()
}

defineExpose({
	create(ord: number) {
		openDialog(null, {
			ord,
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
	:valid="valid"
	@cancel="cancel"
	@save="save"
)
	template(v-if="model")
		BudgetPlanItemOrdInput(
			v-model="model.ord"
			:used-ords="props.usedOrds"
		)
		BudgetPlanItemTitleInput(
			v-model="model.title"
		)
		.kern-fieldset__body.kern-fieldset__body--horizontal
			.flex-1
				BudgetPlanItemRevenuesInput(
					v-model="model.revenues"
				)
				button.mt-4.kern-btn.kern-btn--secondary(
					v-if="remainingRevenues > 0 && remainingRevenues !== model.revenues"
					type="button"
					@click="model.revenues = remainingRevenues"
				)
					span.kern-icon.kern-icon--autorenew(aria-hidden="true")
					span.kern-label {{ $t('budgetPlanItem.remainder.assign', { amount: formatCurrency(remainingRevenues, 'amount') }) }}
			.flex-1
				BudgetPlanItemExpensesInput(
					v-model="model.expenses"
				)
				button.mt-4.kern-btn.kern-btn--secondary(
					v-if="remainingExpenses > 0 && remainingExpenses !== model.expenses"
					type="button"
					@click="model.expenses = remainingExpenses"
				)
					span.kern-icon.kern-icon--autorenew(aria-hidden="true")
					span.kern-label {{ $t('budgetPlanItem.remainder.assign', { amount: formatCurrency(remainingExpenses, 'amount') }) }}
		BudgetPlanItemDescriptionInput(
			v-model="model.description"
		)
</template>
